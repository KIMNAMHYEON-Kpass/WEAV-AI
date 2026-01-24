from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Firebase 토큰 검증 및 JWT 발급
    path('verify-firebase-token/', views.verify_firebase_token, name='verify_firebase_token'),
    
    # JWT 토큰 갱신
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 프로필
    path('profile/', views.user_profile, name='profile'),
]