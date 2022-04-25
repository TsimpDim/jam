from .serializers import GroupSerializer, JobApplicationSerializer, StepSerializer
from .models import Group, JobApplication, Step
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

class GroupsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = GroupSerializer
    queryset = Group.objects.all()
        
    def create(self, request, *args, **kwargs):
        data = request.data
        data['user'] = self.request.user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        
    def get_queryset(self):
        return Group.objects.filter(user_id=self.request.user)

class StepViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StepSerializer
    queryset = Step.objects.all()

    def get_queryset(self):
        return Step.objects.filter(user_id=self.request.user)

class JobApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = JobApplicationSerializer
    queryset = JobApplication.objects.all()

    def get_queryset(self):
        return JobApplication.objects.filter(user_id=self.request.user)

    @action(detail=False, url_path="group")
    def group(self, request):
        groupped_job_apps = {}
        groups = Group.objects.filter(user_id=self.request.user)
        for group in groups.iterator():
            groupped_job_apps[group.name] = JobApplicationSerializer(
                JobApplication.objects.filter(group__id=group.id), many=True
            ).data


        return Response(
            groupped_job_apps
        )
