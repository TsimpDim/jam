from .serializers import GroupSerializer, JobApplicationSerializer, StepSerializer
from .models import Group, JobApplication, Step
from rest_framework import viewsets

class GroupsViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    queryset = Group.objects.all()

class StepViewSet(viewsets.ModelViewSet):
    serializer_class = StepSerializer
    queryset = Step.objects.all()

class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    queryset = JobApplication.objects.all()