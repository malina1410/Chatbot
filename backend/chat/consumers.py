import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatSession, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 1. Security: Reject anonymous users immediately
        if self.scope['user'].is_anonymous:
            await self.close(code=4001) # 4001 = Unauthorized
            return

        self.user = self.scope['user']
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get('message')
        session_id = data.get('session_id')

        # 1. Input Validation
        if not content:
            return

        # 2. Get or Create Session
        session = await self.get_or_create_session(session_id)

        # 3. Save USER message to DB
        await self.save_message(session, content, is_user=True)

        # 4. (Placeholder) Simulate AI Response - We will replace this in Phase 3
        # For now, just echo it back so we can test the frontend connection
        response_text = f"Echo: {content}"
        await self.save_message(session, response_text, is_user=False)

        # 5. Send back to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': response_text,
            'session_id': session.id
        }))

    @database_sync_to_async
    def get_or_create_session(self, session_id):
        if session_id:
            try:
                return ChatSession.objects.get(id=session_id, user=self.user)
            except ChatSession.DoesNotExist:
                pass
        # Create new if not found
        return ChatSession.objects.create(user=self.user)

    @database_sync_to_async
    def save_message(self, session, content, is_user):
        return Message.objects.create(session=session, content=content, is_user=is_user)