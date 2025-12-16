import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from chat.middleware import CookieAuthMiddleware
import chat.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(  # 1. Checks Allowed Hosts (Security)
        CookieAuthMiddleware(                  # 2. Checks Cookies (Auth)
            URLRouter(
                chat.routing.websocket_urlpatterns
            )
        )
    ),
})