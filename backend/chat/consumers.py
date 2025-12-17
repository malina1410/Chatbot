import json
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatSession, Message
from .ai_utils import get_ai_response

class ChatConsumer(AsyncWebsocketConsumer):
    # Rate Limiting: Minimum seconds between messages
    RATE_LIMIT_SECONDS = 1.0 
    
    async def connect(self):
        # 1. Security Check
        if self.scope['user'].is_anonymous:
            await self.close(code=4001)
            return

        self.user = self.scope['user']
        # Track last message time for Rate Limiting
        self.last_message_time = 0 
        
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
            try:
                # 2. Rate Limiting Check
                current_time = time.time()
                if current_time - self.last_message_time < self.RATE_LIMIT_SECONDS:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'You are typing too fast. Please wait a moment.'
                    }))
                    return
                
                self.last_message_time = current_time

                # 3. Parse Data
                try:
                    data = json.loads(text_data)
                except json.JSONDecodeError:
                    return
                    
                content = data.get('message', '').strip()
                session_id = data.get('session_id')

                if not content:
                    return

                # 4. Get/Create Session & Save User Message
                session = await self.get_or_create_session(session_id)
                await self.save_message(session, content, is_user=True)

                # 5. Build Context (The Sliding Window)
                history = await self.get_formatted_history(session)

                # 6. Call the Brain
                # We use a try/except here to catch AI specific errors
                try:
                    ai_reply = await database_sync_to_async(get_ai_response)(history, content)
                except Exception as e:
                    print(f"⚠️ AI GENERATION ERROR: {e}")
                    ai_reply = "I'm having trouble thinking right now. Please try again."

                # 7. Save Bot Message
                await self.save_message(session, ai_reply, is_user=False)

                # 8. Send Response to Frontend
                await self.send(text_data=json.dumps({
                    'type': 'chat_message',
                    'message': ai_reply,
                    'session_id': session.id
                }))

            except Exception as e:
                # --- CATCH THE CRASH HERE ---
                import traceback
                print("❌ CRITICAL CONSUMER ERROR:")
                traceback.print_exc()  # This prints the exact line causing the crash
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f"Server Error: {str(e)}"
                }))

    # --- Database Helpers ---

    @database_sync_to_async
    def get_or_create_session(self, session_id):
        if session_id:
            try:
                return ChatSession.objects.get(id=session_id, user=self.user)
            except ChatSession.DoesNotExist:
                pass
        return ChatSession.objects.create(user=self.user)

    @database_sync_to_async
    def save_message(self, session, content, is_user):
        return Message.objects.create(session=session, content=content, is_user=is_user)

    @database_sync_to_async
    def get_formatted_history(self, session):
        # Fetch last 10 messages (excluding the one we just saved)
        # We slice [:10] on the queryset.
        recent_messages = session.messages.all().order_by('-timestamp')[:10]
        
        # Convert to Gemini Format: [{'role': 'user', 'parts': ['text']}]
        # Note: We must reverse them because we fetched them newest-first
        formatted = []
        for msg in reversed(recent_messages):
            # Do not include the message we just sent (it's passed separately as prompt)
            role = 'user' if msg.is_user else 'model'
            formatted.append({
                'role': role,
                'parts': [msg.content]
            })
        
        # Remove the last item if it matches the current input to avoid duplication
        # (Since we saved it to DB in step 4, it might appear in this list)
        if formatted and formatted[-1]['role'] == 'user':
            formatted.pop()
            
        return formatted