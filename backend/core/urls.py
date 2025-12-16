from django.contrib import admin
from django.urls import path
from chat import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', views.login_view),
    path('api/logout/', views.logout_view),
    path('api/csrf/', views.get_csrf_token),
    path('api/auth-check/', views.check_auth),
]