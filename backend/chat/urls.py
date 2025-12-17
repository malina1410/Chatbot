from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatSessionViewSet

# Create a router and register our viewset with it.
router = DefaultRouter()
router.register(r'sessions', ChatSessionViewSet, basename='chat-session')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('api/', include(router.urls)),
]