from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

User = get_user_model()

@database_sync_to_async
def get_user(session_key):
    # This imports SessionStore correctly for the engine you are using
    from django.contrib.sessions.backends.db import SessionStore
    engine = SessionStore(session_key=session_key)
    user_id = engine.get_decoded().get('_auth_user_id')
    
    if not user_id:
        return AnonymousUser()
    
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class CookieAuthMiddleware:
    """
    Custom middleware to read sessionid cookie from WebSocket headers
    and populate scope['user'].
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # 1. Parse headers to find 'cookie'
        headers = dict(scope['headers'])
        cookies = {}
        if b'cookie' in headers:
            cookie_str = headers[b'cookie'].decode()
            for cookie in cookie_str.split('; '):
                if '=' in cookie:
                    key, value = cookie.split('=', 1)
                    cookies[key] = value
        
        # 2. Get session_id and fetch user
        session_key = cookies.get('sessionid')
        if session_key:
            scope['user'] = await get_user(session_key)
        else:
            scope['user'] = AnonymousUser()
            
        return await self.inner(scope, receive, send)