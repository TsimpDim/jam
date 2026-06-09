import logging
from datetime import date

from django.contrib.auth import authenticate, get_user_model
from knox.models import AuthToken
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

from extapi.serializers import (
    AddLeadSerializer,
    ExtensionLoginSerializer,
    GroupSerializer,
    JobApplicationSerializer,
    LeadSerializer,
    StepSerializer,
)
from jam.models import Group, JobApplication, Lead, Step

logger = logging.getLogger(__name__)
User = get_user_model()


class ExtensionLoginView(generics.GenericAPIView):
    """Authenticate extension user and return a Knox token."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = ExtensionLoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )

        if not user or not user.is_active:
            raise ValidationError({"non_field_errors": ["Invalid username or password."]})

        _, token = AuthToken.objects.create(user)

        return Response({
            "token": token,
            "user": {"pk": user.pk, "username": user.username},
        })


class ExtensionLogoutView(generics.GenericAPIView):
    """Delete the current user's Knox token."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request._auth.delete()
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class GroupListView(generics.ListAPIView):
    """List all groups for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GroupSerializer

    def get_queryset(self):
        return Group.objects.filter(user=self.request.user).order_by("position", "id")


class StepListView(generics.ListAPIView):
    """List all steps for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StepSerializer

    def get_queryset(self):
        return Step.objects.filter(user=self.request.user)


class LeadListView(generics.ListAPIView):
    """List all leads for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LeadSerializer

    def get_queryset(self):
        return Lead.objects.filter(user=self.request.user)


class AddLeadView(generics.CreateAPIView):
    """Create a new lead for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AddLeadSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, date=date.today())


class AddApplicationView(generics.CreateAPIView):
    """Create a new job application for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JobApplicationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, date=date.today())
