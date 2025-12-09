"""
User authentication URLs
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    UserListView,
    change_password,
    forgot_password
)

app_name = 'users'

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('list/', UserListView.as_view(), name='list'),
    path('change-password/', change_password, name='change-password'),
    path('forgot-password/', forgot_password, name='forgot-password'),
]

