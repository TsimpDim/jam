from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.template.loader import render_to_string
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import csrf_exempt
from knox.models import AuthToken
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.serializers import CharField, EmailField, Serializer, ValidationError

User = get_user_model()


class RegisterSerializer(Serializer):
    username = CharField()
    email = EmailField()
    password1 = CharField(write_only=True)
    password2 = CharField(write_only=True)

    def validate(self, attrs):
        if not attrs.get("username"):
            raise ValidationError({"username": "Username is required."})
        if len(attrs.get("password1", "")) < 8:
            raise ValidationError({"password1": "Password must be at least 8 characters."})
        if attrs.get("password1") != attrs.get("password2"):
            raise ValidationError({"password2": "Passwords do not match."})
        if User.objects.filter(username__iexact=attrs.get("username")).exists():
            raise ValidationError({"username": "A user with that username already exists."})
        if User.objects.filter(email__iexact=attrs.get("email")).exists():
            raise ValidationError({"email": "A user with that email already exists."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password1")
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=password,
        )


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
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user = _authenticate_or_error(request)
        login(request, user)
        # Ensure CSRF cookie is set for subsequent requests
        get_token(request)
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
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        # Ensure CSRF cookie is set for subsequent requests
        get_token(request)
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


# Password reset serializers and views
class PasswordResetRequestSerializer(Serializer):
    email = EmailField()


class PasswordResetConfirmSerializer(Serializer):
    _user = None
    uid = CharField()
    token = CharField()
    new_password1 = CharField(write_only=True)
    new_password2 = CharField(write_only=True)

    def validate(self, attrs):
        if attrs.get("new_password1") != attrs.get("new_password2"):
            raise ValidationError({"new_password2": "Passwords do not match."})
        if len(attrs.get("new_password1", "")) < 8:
            raise ValidationError({"new_password1": "Password must be at least 8 characters."})

        # Validate uid and token
        try:
            uid = force_str(urlsafe_base64_decode(attrs["uid"]))
            self._user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise ValidationError({"uid": "Invalid uid."})

        if not default_token_generator.check_token(self._user, attrs["token"]):
            raise ValidationError({"token": "Invalid or expired token."})

        return attrs

    def save(self):
        user = self._user
        user.set_password(self.validated_data["new_password1"])
        user.save(update_fields=["password"])
        return user


class PasswordResetRequestView(generics.GenericAPIView):
    """Accepts an email, generates a reset token, and sends a password reset email."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        # Find user by email (always return success to prevent email enumeration)
        users = User.objects.filter(email__iexact=email)
        if users.exists():
            user = users.first()
            if user.has_usable_password():
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                reset_url = f"{settings.FRONTEND_URL}/auth/reset-password/{uid}/{token}/"

                send_mail(
                    subject="Reset your JAM! password",
                    message=f"Click the link below to reset your password:\n\n{reset_url}\n\nThis link will expire in 3 days.\n\nIf you did not request a password reset, please ignore this email.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                    html_message=render_to_string(
                        "email/password_reset.html",
                        {"reset_url": reset_url, "username": user.username},
                    ),
                )

        # Always return success to prevent email enumeration
        return Response(
            {"detail": "If an account with that email exists, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    """Validates the reset token and updates the user's password."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password has been reset successfully. You can now log in with your new password."},
            status=status.HTTP_200_OK,
        )