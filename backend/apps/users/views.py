"""
User views for authentication and profile management
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.contrib.auth import update_session_auth_hash
import structlog

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer
)

User = get_user_model()
logger = structlog.get_logger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view"""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        logger.info("User registered", namespace="users", user_id=user.id, username=user.username)
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view (get/update own profile)"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        logger.debug("Fetching user profile", namespace="users", user_id=self.request.user.id)
        return self.request.user


class UserListView(generics.ListAPIView):
    """List users (admin only)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin():
            return User.objects.all()
        elif user.is_manager():
            # Managers can see customers
            return User.objects.filter(role=User.Role.CUSTOMER)
        return User.objects.none()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change password endpoint"""
    serializer = ChangePasswordSerializer(data=request.data)

    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.data.get('old_password')):
            return Response(
                {"old_password": ["Wrong password."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.data.get('new_password'))
        user.save()
        update_session_auth_hash(request, user)
        logger.info("Password changed", namespace="users", user_id=user.id)
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password(request):
    """Forgot password endpoint"""
    serializer = ForgotPasswordSerializer(data=request.data)

    if serializer.is_valid():
        username = serializer.data.get('username')
        new_password = serializer.data.get('new_password')

        try:
            user = User.objects.get(username=username)
            user.set_password(new_password)
            user.save()
            logger.info("Password reset", namespace="users", user_id=user.id)
            return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"username": ["User not found."]},
                status=status.HTTP_404_NOT_FOUND
            )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

