from .serializers import GroupSerializer, JobApplicationSerializer, StepSerializer, TimelineSerializer
from .models import Group, JobApplication, Step, Timeline
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

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
    
    def create(self, request, *args, **kwargs):
        data = request.data
        data['user'] = self.request.user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        return Step.objects.filter(user_id=self.request.user)

    @action(detail=False, url_path="initial")
    def group(self, request):
        return Response(
            StepSerializer(
                Step.objects.filter(type='S'), many=True
            ).data
        )

class JobApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = JobApplicationSerializer
    queryset = JobApplication.objects.all()

    def create(self, request, *args, **kwargs):
        data = request.data
        data['user'] = self.request.user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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

class TimelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_application_id, format=None):
        jap = Timeline.objects.filter(application=job_application_id)
        return Response(
            TimelineSerializer(
                jap, many=True
            ).data
        )