from django.contrib.auth import authenticate, get_user_model, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from knox.models import AuthToken
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.serializers import CharField, Serializer, ValidationError

User = get_user_model()

class RegisterSerializer(Serializer):
    username = CharField()
    password1 = CharField(write_only=True)
    password2 = CharField(write_only=True)

    def validate(self, attrs):
        if not attrs.get("username"):
            raise ValidationError({"username": "Username is required."})
        if len(attrs.get("password1", "")) < 8:
            raise ValidationError({"password1": "Password must be at least 8 characters."})
        if attrs.get("password1") != attrs.get("password2"):
            raise ValidationError({"password2": "Passwords do not match."})
        if User.objects.filter(username=attrs.get("username")).exists():
            raise ValidationError({"username": "A user with that username already exists."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password1")
        return User.objects.create_user(username=validated_data["username"], password=password)


def _authenticate_or_error(request):
    """Shared credential check used by LoginView and TokenView."""
    user = authenticate(
        request,
        username=request.data.get("username"),
        password=request.data.get("password"),
    )
    if not user or not user.is_active:
        raise ValidationError({"non_field_errors": ["Invalid username or password."]})
    return user


# Web-client views (Django session)
@method_decorator(csrf_exempt, name='dispatch')
class LoginView(generics.GenericAPIView):
    """Web client: create a Django session. No Knox token issued."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user = _authenticate_or_error(request)
        login(request, user)
        return Response({"user": {"pk": user.pk, "username": user.username}})

class LogoutView(generics.GenericAPIView):
    """Web client: destroy the Django session."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Successfully logged out."})

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    """Shared: create a user, start a session, and return a Knox token."""
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return Response(
            {"user": {"pk": user.pk, "username": user.username}},
            status=status.HTTP_201_CREATED,
        )

# Extension views (Knox token)
class TokenView(generics.GenericAPIView):
    """Extension: issue a Knox token. No session created."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user = _authenticate_or_error(request)
        _, token = AuthToken.objects.create(user)
        return Response({"token": token, "user": {"pk": user.pk, "username": user.username}})


class TokenLogoutView(generics.GenericAPIView):
    """Extension: revoke the current Knox token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not hasattr(request, "auth") or request.auth is None:
            return Response(
                {"detail": "No token to revoke."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.auth.delete()
        return Response({"detail": "Successfully logged out."})


# Shared views
class MeView(generics.GenericAPIView):
    """Shared: returns the authenticated user regardless of auth mechanism."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"pk": request.user.pk, "username": request.user.username})
