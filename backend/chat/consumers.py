import json
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatSession, Message
from .ai_utils import get_ai_response
import google.generativeai as genai

class ChatConsumer(AsyncWebsocketConsumer):
    RATE_LIMIT_SECONDS = 0.5

    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return
        self.last_message_time = 0
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        try:
            # 1. Basic Rate Limit
            if time.time() - self.last_message_time < self.RATE_LIMIT_SECONDS:
                return
            self.last_message_time = time.time()

            # 2. Parse Data
            data = json.loads(text_data)
            content = data.get('message', '').strip()
            session_id = data.get('session_id')
            
            # --- DEBUG LOG 1: What did the Frontend send? ---
            print(f"\n🔵 [DEBUG] Received Message: '{content}'")
            print(f"🔵 [DEBUG] Incoming Session ID: {session_id}")

            if not content: 
                return

            # 3. Get/Create Session
            session, is_new = await self.get_or_create_session(session_id)
            print(f"🟢 [DEBUG] Using Database Session ID: {session.id} (Title: {session.title})")

            # 4. Auto-Title if needed
            if is_new or session.title == "New Chat":
                await self.generate_smart_title(session, content)

            # 5. Save User Message
            user_msg = await self.save_message(session, content, is_user=True)

            # 6. Fetch History
            history = await self.get_formatted_history(session, exclude_msg_id=user_msg.id)
            
            # --- DEBUG LOG 2: What is the AI reading? ---
            print(f"🟡 [DEBUG] History sent to AI ({len(history)} items):")
            for item in history:
                print(f"   - {item['role']}: {item['parts'][0][:50]}...") # Print first 50 chars

            # 7. Get AI Response
            ai_reply = await database_sync_to_async(get_ai_response)(history, content)

            # 8. Save AI Reply
            await self.save_message(session, ai_reply, is_user=False)

            # 9. Send to Frontend
            await self.send(text_data=json.dumps({
                'type': 'chat_message',
                'message': ai_reply,
                'session_id': session.id
            }))

        except Exception as e:
            import traceback
            traceback.print_exc()

    # --- Helpers ---

    @database_sync_to_async
    def get_or_create_session(self, session_id):
        if session_id:
            try:
                return ChatSession.objects.get(id=session_id, user=self.user), False
            except ChatSession.DoesNotExist:
                print(f"🔴 [DEBUG] Session {session_id} not found! Creating new.")
        return ChatSession.objects.create(user=self.user, title="New Chat"), True

    @database_sync_to_async
    def save_message(self, session, content, is_user):
        return Message.objects.create(session=session, content=content, is_user=is_user)

    @database_sync_to_async
    def get_formatted_history(self, session, exclude_msg_id):
        # Fetch LAST 20 messages (Newest first)
        recent_messages = session.messages.exclude(id=exclude_msg_id).order_by('-created_at')[:20]
        # Reverse to Chronological (Oldest -> Newest)
        chronological_messages = reversed(list(recent_messages))
        
        history = []
        for msg in chronological_messages:
            history.append({"role": "user" if msg.is_user else "model", "parts": [msg.content]})
        return history

    @database_sync_to_async
    def generate_smart_title(self, session, first_message):
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(f"Summarize in 3 words: {first_message}")
            session.title = response.text.strip().replace('"', '')
            session.save()
        except: pass