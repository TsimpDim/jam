from datetime import datetime
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
from dateutil.relativedelta import relativedelta

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
                if date < firstStepDate:
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

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = self.request.user

        # Basic JobApps
        total_jobapps = JobApplication.objects.filter(user=user)
        completed_jobapps = [jap for jap in total_jobapps if jap.is_completed()]
        completed_jobapps_count = len(completed_jobapps)
        pending_jobapps = total_jobapps.count() - completed_jobapps_count

        # Break-down by Steps
        timelines = Timeline.objects.filter(user=user)
        step_breakdown = {}
        for timeline in timelines:
            if timeline.step.name in step_breakdown:
                step_breakdown[timeline.step.name]['count'] += 1
            else:
                step_breakdown[timeline.step.name] = {
                    'count': 0,
                    'color': timeline.step.color
                }

        # Avg Steps per Application
        steps_per_apps = len(total_jobapps) / len(timelines)

        # Avg Time in-between Steps
        non_relevant_dates = len(timelines.filter(date_relevant=False))
        count_dates_used = 0
        year_delta_sum = 0
        month_delta_sum = 0
        day_delta_sum = 0
        hour_delta_sum = 0
        for idx, timeline in enumerate(list(timelines)[:-1]):
            next_tl = timelines[idx+1]
            # don't take non-date-relevant timelines into consideration
            if timeline.date_relevant and next_tl.date_relevant:
                time_delta = relativedelta(next_tl.date, timeline.date)
                year_delta_sum += time_delta.years
                month_delta_sum += time_delta.months
                day_delta_sum += time_delta.days
                hour_delta_sum += time_delta.hours
                count_dates_used += 1

        time_between_steps = {
            'years': f'{year_delta_sum/count_dates_used:.2f}',
            'months': f'{month_delta_sum/count_dates_used:.2f}',
            'days': f'{day_delta_sum/count_dates_used:.2f}',
            'hours': f'{hour_delta_sum/count_dates_used:.2f}',
        }

        # Applied Through breakdown
        all_applied_through = [i['applied_through'] for i in total_jobapps.values('applied_through').distinct()]
        all_applied_through_count = {} 
        for at in all_applied_through:
            stored_key = at
            if at == '' or not at:
                stored_key = 'empty'

            if stored_key not in all_applied_through_count:
                all_applied_through_count[stored_key] = 0
            all_applied_through_count[stored_key] += total_jobapps.filter(applied_through=at).count()

        # Avg. time until completion
        count_dates_used = 0
        month_delta_sum = 0
        day_delta_sum = 0
        hour_delta_sum = 0
        year_delta_sum = 0
        for app in completed_jobapps:
            time_delta = app.time_took()

            month_delta_sum += time_delta.months
            day_delta_sum += time_delta.days
            hour_delta_sum += time_delta.hours
            year_delta_sum += time_delta.years
            count_dates_used += 1
        
        time_to_completion = {
            'months': f'{month_delta_sum/count_dates_used:.2f}',
            'days': f'{day_delta_sum/count_dates_used:.2f}',
            'hours': f'{hour_delta_sum/count_dates_used:.2f}',
            'years': f'{year_delta_sum/count_dates_used:.2f}'
        }
        
        
        return Response({
            'totalJobApps': total_jobapps.count(),
            'completedJobApps': completed_jobapps_count,
            'pendingJobApps': pending_jobapps,
            'stepBreakdown': step_breakdown,
            'stepsPerApp': f'{steps_per_apps:.2f}',
            'timeBetweenSteps': time_between_steps,
            'nonRelevantDates': non_relevant_dates,
            'appliedThrough':  all_applied_through_count,
            'timeToCompletion': time_to_completion
        }, status=200)
        