from django.contrib import admin
from django.urls import path, include  # 1. ADD 'include' HERE
from chat import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', views.login_view),
    path('api/logout/', views.logout_view),
    path('api/csrf/', views.get_csrf_token),
    path('api/auth-check/', views.check_auth),
    
    # 2. ADD THIS LINE TO CONNECT THE CHAT APP
    path('', include('chat.urls')), 
]