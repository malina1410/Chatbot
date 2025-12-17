import json
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatSession, Message
from .ai_utils import get_ai_response
import google.generativeai as genai

class ChatConsumer(AsyncWebsocketConsumer):
    # Rate limiting: allow 1 message every 0.5 seconds
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
            # 1. Rate Limiting
            current_time = time.time()
            if current_time - self.last_message_time < self.RATE_LIMIT_SECONDS:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'You are typing too fast. Please wait a moment.'
                }))
                return
            
            self.last_message_time = current_time

            # 2. Parse Incoming Data
            try:
                data = json.loads(text_data)
            except json.JSONDecodeError:
                return
                
            content = data.get('message', '').strip()
            session_id = data.get('session_id')

            if not content:
                return

            # 3. Get or Create Session
            # We pass the content so we can generate a title if it's a new session
            session, is_new = await self.get_or_create_session(session_id)
            
            # 4. Smart Title Generation (Background Task)
            # If this is a new session (or title is still default), generate a title from the prompt
            if is_new or session.title == "New Chat":
                await self.generate_smart_title(session, content)

            # 5. Save User Message
            await self.save_message(session, content, is_user=True)

            # 6. Build History Context
            history = await self.get_formatted_history(session)

            # 7. Get AI Response
            try:
                ai_reply = await database_sync_to_async(get_ai_response)(history, content)
            except Exception as e:
                print(f"⚠️ AI GENERATION ERROR: {e}")
                ai_reply = "I'm having trouble thinking right now. Please try again."

            # 8. Save AI Message
            await self.save_message(session, ai_reply, is_user=False)

            # 9. Send Response to Frontend
            await self.send(text_data=json.dumps({
                'type': 'chat_message',
                'message': ai_reply,
                'session_id': session.id
            }))

        except Exception as e:
            import traceback
            print("❌ CRITICAL CONSUMER ERROR:")
            traceback.print_exc()
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': "An internal error occurred."
            }))

    # --- Database Helpers ---

    @database_sync_to_async
    def get_or_create_session(self, session_id):
        """
        Returns (session, is_new_or_default_title)
        """
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=self.user)
                return session, False
            except ChatSession.DoesNotExist:
                pass 
        
        # Create new session
        session = ChatSession.objects.create(user=self.user, title="New Chat")
        return session, True

    @database_sync_to_async
    def generate_smart_title(self, session, first_message):
        """
        Uses Gemini to summarize the first message into a short title.
        """
        try:
            # We use a separate cheap call to Gemini for this
            model = genai.GenerativeModel("gemini-2.0-flash")
            prompt = f"Summarize this user prompt into a short, 3-5 word title for a chat history sidebar. Do not use quotes. Prompt: {first_message}"
            
            response = model.generate_content(prompt)
            title = response.text.strip()
            
            # Clean up title (remove quotes if model added them)
            title = title.replace('"', '').replace("'", "")
            
            # Save to DB
            session.title = title
            session.save()
            print(f"✨ Auto-Title Generated: {title}")
            
        except Exception as e:
            print(f"⚠️ Title Generation Failed: {e}")
            # Fallback to simple truncation
            fallback = first_message[:30].strip() + "..."
            session.title = fallback
            session.save()

    @database_sync_to_async
    def save_message(self, session, content, is_user):
        return Message.objects.create(session=session, content=content, is_user=is_user)

    @database_sync_to_async
    def get_formatted_history(self, session):
        # Retrieve the last 10 messages for context
        messages = session.messages.all().order_by('created_at')[:20]
        history = []
        for msg in messages:
            role = "user" if msg.is_user else "model"
            history.append({"role": role, "parts": [msg.content]})
        return history