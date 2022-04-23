from .serializers import GroupSerializer, JobApplicationSerializer, StepSerializer
from .models import Group, JobApplication, Step
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

class GroupsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = GroupSerializer
    queryset = Group.objects.all()

class StepViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StepSerializer
    queryset = Step.objects.all()

class JobApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = JobApplicationSerializer
    queryset = JobApplication.objects.all()