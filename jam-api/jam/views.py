from datetime import datetime, timedelta
from .serializers import (
    GroupSerializer,
    JobApplicationSerializer,
    StepSerializer,
    TimelineSerializer,
)
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
        data["user"] = self.request.user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def get_queryset(self):
        return Group.objects.filter(user_id=self.request.user)


class StepViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StepSerializer
    queryset = Step.objects.all()

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = self.request.user.id
        
        if 'color' not in data:
            data["color"] = Step.DEFAULT_COLOR

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def get_queryset(self):
        return Step.objects.filter(user_id=self.request.user)

    @action(
        detail=False,
        url_path="initial",
        name="initial-steps",
        methods=["GET"],
        permission_classes=[IsAuthenticated],
    )
    def initial_steps(self, request):
        return Response(StepSerializer(Step.objects.filter(type="S"), many=True).data)


class JobApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = JobApplicationSerializer
    queryset = JobApplication.objects.all()

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = self.request.user.id

        # set default date to NOW if not given
        if "date" not in data:
            data["date"] = datetime.now().date()

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def get_queryset(self):
        return JobApplication.objects.filter(user_id=self.request.user)

    @action(
        detail=False,
        methods=["GET"],
        url_path="group",
        name="per-group",
        permission_classes=[IsAuthenticated],
    )
    def group(self, request):
        groupped_job_apps = {}
        groups = Group.objects.filter(user_id=self.request.user)
        for group in groups.iterator():
            groupped_job_apps[group.name] = JobApplicationSerializer(
                JobApplication.objects.filter(group__id=group.id), many=True
            ).data

        return Response(groupped_job_apps)


class TimelineViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TimelineSerializer

    def get_queryset(self):
        return Timeline.objects.filter(user_id=self.request.user)

    @action(
        detail=False,
        methods=["GET"],
        url_path="jobapp/(?P<job_application_id>\d+)",
        name="per-jobapp",
        permission_classes=[IsAuthenticated],
    )
    def get_per_jobapp(self, request, job_application_id, format=None):
        jap = Timeline.objects.filter(application=job_application_id).order_by('date')
        return Response(TimelineSerializer(jap, many=True).data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        app = instance.application

        # set default date to NOW if not given
        if "date" in request.data:
            date_str = request.data["date"]
            lastStepDate = Timeline.objects.filter(application=app).last().date
            firstStepDate = Timeline.objects.filter(application=app).first().date

            if date_str == '?':
                # Get last timeline
                lastStepDate = Timeline.objects.filter(application=app).last().date
                if lastStepDate:
                    request.data['date'] = lastStepDate + timedelta(hours=1)
                    request.data['date_relevant'] = False
                else:
                    return Response(status=status.HTTP_400_BAD_REQUEST)
            else:
                date = datetime.strptime(date_str, '%Y-%m-%d').date() # set default date to NOW if not given
                if firstStepDate != lastStepDate and date < firstStepDate or date > lastStepDate:
                    return Response(status=status.HTTP_400_BAD_REQUEST)
                request.data['date_relevant'] = True

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def create(self, request):
        group_id = request.data["group"]
        step_id = request.data["step"]
        notes = request.data["notes"] if 'notes' in request.data else None
        user = self.request.user
        job_application_id = request.data["jobapp"]
        
        date_relevant = True
        if "date" in request.data:
            date_str = request.data["date"]
            lastStepDate = Timeline.objects.filter(application=job_application_id).last().date
            firstStepDate = Timeline.objects.filter(application=job_application_id).first().date

            if date_str == '?':
                # Set date to prev + 1hour if ?
                if lastStepDate:
                    date = lastStepDate + timedelta(hours=1)
                    date_relevant = False
                else:
                    return Response(status=status.HTTP_400_BAD_REQUEST)
            else:
                date = datetime.strptime(date_str, '%Y-%m-%d').date() # set default date to NOW if not given
                if date < firstStepDate or date > lastStepDate:
                    return Response(status=status.HTTP_400_BAD_REQUEST)
        else:
            date = datetime.now().date()

        step = Step.objects.get(id=step_id)
        application = JobApplication.objects.get(id=job_application_id)
        group = Group.objects.get(id=group_id)
        first_step = Timeline.objects.filter(application=application, group=group).first()
        last_step = Timeline.objects.filter(application=application, group=group).last()

        # We do not allow a user to add a step
        # that occurred before the starting step.
        # But they can otherwise add a DEFAULT step and they will
        # be shown sorted by date. Non-default steps must be at the
        # start or end of a timeline
        if not application.is_completed() and first_step.date <= date: 
            if step.type != 'D' and last_step.date > date:
                return Response(status=status.HTTP_400_BAD_REQUEST)

            t = Timeline(
                application=application,
                group=group,
                step=step,
                notes=notes,
                date_relevant=date_relevant,
                date=date,
                user=user,
            )
            t.save()

            return Response(status=status.HTTP_201_CREATED)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)
