import json  
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes 
from rest_framework.permissions import IsAuthenticated, AllowAny 
from rest_framework.response import Response
from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, MessageSerializer

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        return Response({'status': 'success', 'username': user.username})
    return Response({'status': 'error', 'message': 'Invalid credentials'}, status=401)

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'status': 'success'})

@api_view(['GET'])
@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'csrfToken': 'Set in cookie'})

@api_view(['GET'])
def check_auth(request):
    if request.user.is_authenticated:
        return Response({'isAuthenticated': True, 'username': request.user.username})
    return Response({'isAuthenticated': False})

class ChatSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        # critical: Only return chats belonging to the logged-in user
        return ChatSession.objects.filter(user=self.request.user).order_by('-created_at')

    # Custom Action: Get all messages for a specific session
    # URL: /api/sessions/<id>/messages/
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        session = self.get_object() # This ensures user owns the session
        messages = session.messages.all().order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    # Custom Action: Rename a session
    # URL: /api/sessions/<id>/rename/
    @action(detail=True, methods=['patch'])
    def rename(self, request, pk=None):
        session = self.get_object()
        new_title = request.data.get('title')
        if new_title:
            session.title = new_title
            session.save()
            return Response({'status': 'title updated', 'title': new_title})
        return Response({'error': 'title required'}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@permission_classes([AllowAny]) # Allows unauthenticated users to access this
def register_view(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        confirm_password = data.get('confirm_password')

        if not username or not password:
            return JsonResponse({'error': 'Username and password are required'}, status=400)

        if password != confirm_password:
            return JsonResponse({'error': 'Passwords do not match'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already taken'}, status=400)

        # Create the user
        user = User.objects.create_user(username=username, password=password)
        
        # Log them in immediately so they can chat right away
        login(request, user)

        return JsonResponse({'username': user.username, 'message': 'User created successfully'})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)