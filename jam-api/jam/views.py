from datetime import datetime
from django.shortcuts import get_object_or_404
from django.db import models
from .serializers import (
    GroupSerializer,
    JobApplicationSerializer,
    JobAdSnapshotSerializer,
    StepSerializer,
    TimelineSerializer,
    LeadSerializer
)
from .models import Group, JobApplication, JobAdSnapshot, Step, Timeline, Lead
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from dateutil.relativedelta import relativedelta
from datetime import timedelta

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
        return Group.objects.filter(user_id=self.request.user).order_by('-id')


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
        groups = Group.objects.filter(user_id=self.request.user).order_by('-id')
        for group in groups.iterator():
            groupped_job_apps[group.name] = JobApplicationSerializer(
                JobApplication.objects.filter(group__id=group.id), many=True
            ).data

        return Response(groupped_job_apps)

    @action(
        detail=True,
        methods=["get"],
        url_path="ad-snapshot",
        permission_classes=[IsAuthenticated],
    )
    def ad_snapshot(self, request, pk=None):
        try:
            snap = JobAdSnapshot.objects.get(job_application_id=pk)
            return Response(JobAdSnapshotSerializer(snap).data)
        except JobAdSnapshot.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


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
        
        # Get the global timeline for the application, ordered by date
        timeline_qs = Timeline.objects.filter(application=application).order_by('date')
        first_step = timeline_qs.first()
        last_step = timeline_qs.last()

        # We do not allow a user to add a step
        # that occurred before the starting step.
        # But they can otherwise add a DEFAULT step and they will
        # be shown sorted by date. Non-default steps must be at the
        # start or end of a timeline
        if not application.is_completed() and (first_step is None or first_step.date <= date): 
            if step.type != 'D' and last_step and last_step.date > date:
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
                    'count': 1,
                    'color': timeline.step.color
                }

        # Avg Steps per Application
        steps_per_apps = len(total_jobapps) / len(timelines) if timelines.count() > 0 else 0

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
            'years': f'{year_delta_sum/count_dates_used:.2f}' if count_dates_used > 0 else '0.00',
            'months': f'{month_delta_sum/count_dates_used:.2f}' if count_dates_used > 0 else '0.00',
            'days': f'{day_delta_sum/count_dates_used:.2f}' if count_dates_used > 0 else '0.00',
            'hours': f'{hour_delta_sum/count_dates_used:.2f}' if count_dates_used > 0 else '0.00',
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
            'months': f'{month_delta_sum/count_dates_used:.2f}' if count_dates_used > 0 else '0.00',
            'days': f'{day_delta_sum/count_dates_used:.2f}' if count_dates_used > 0 else '0.00',
            'hours': f'{hour_delta_sum/count_dates_used:.2f}' if count_dates_used > 0 else '0.00',
            'years': f'{year_delta_sum/count_dates_used:.2f}' if count_dates_used > 0 else '0.00'
        }

        # ============ NEW METRICS ============

        # 1. Conversion Funnel (by step type: S -> D -> E)
        step_types = {'S': 'Started', 'D': 'In Progress', 'E': 'Completed'}
        conversion_funnel = {}
        for stype, sname in step_types.items():
            step_timelines = timelines.filter(step__type=stype)
            apps_with_step = step_timelines.values('application_id').distinct().count()
            conversion_funnel[sname] = {
                'count': apps_with_step,
                'percentage': f'{(apps_with_step / total_jobapps.count() * 100):.1f}' if total_jobapps.count() > 0 else '0.0'
            }

        # 2. Source Effectiveness (which sources lead to completion)
        source_effectiveness = {}
        for at in all_applied_through:
            stored_key = at if at and at != '' else 'empty'
            apps_with_source = total_jobapps.filter(applied_through=at)
            completed_count = len([a for a in apps_with_source if a.is_completed()])
            source_effectiveness[stored_key] = {
                'total': apps_with_source.count(),
                'completed': completed_count,
                'conversion_rate': f'{(completed_count / apps_with_source.count() * 100):.1f}' if apps_with_source.count() > 0 else '0.0'
            }

        # 3. Lead to Application Conversion
        total_leads = Lead.objects.filter(user=user).count()
        
        # 4. Stage Duration (avg time spent at each step)
        stage_duration = {}
        all_steps = Step.objects.filter(user=user)
        for step in all_steps:
            step_timelines = timelines.filter(step=step).order_by('date')
            step_timeline_list = list(step_timelines)
            if len(step_timeline_list) < 2:
                continue
            
            total_duration = 0
            count = 0
            for idx, tl in enumerate(step_timeline_list[:-1]):
                next_tl = step_timeline_list[idx + 1]
                if tl.date_relevant and next_tl.date_relevant:
                    delta = relativedelta(next_tl.date, tl.date)
                    total_duration += delta.days + delta.months * 30 + delta.years * 365
                    count += 1
            
            if count > 0:
                avg_days = total_duration / count
                stage_duration[step.name] = {
                    'avg_days': f'{avg_days:.1f}',
                    'color': step.color
                }

        # 5. Time Trends (applications per week/month)
        from datetime import timedelta
        from django.db.models.functions import TruncWeek, TruncMonth
        
        apps_by_week = total_jobapps.annotate(week=TruncWeek('date')).values('week').annotate(count=models.Count('id')).order_by('-week')[:12]
        apps_by_month = total_jobapps.annotate(month=TruncMonth('date')).values('month').annotate(count=models.Count('id')).order_by('-month')[:12]
        
        time_trends = {
            'weekly': [{'period': str(item['week']), 'count': item['count']} for item in apps_by_week if item['week']],
            'monthly': [{'period': str(item['month']), 'count': item['count']} for item in apps_by_month if item['month']]
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
            'timeToCompletion': time_to_completion,
            'conversionFunnel': conversion_funnel,
            'sourceEffectiveness': source_effectiveness,
            'totalLeads': total_leads,
            'stageDuration': stage_duration,
            'timeTrends': time_trends
        }, status=200)

class LeadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = LeadSerializer
    queryset = Lead.objects.all()

    def get_queryset(self):
        queryset = Lead.objects.filter(user_id=self.request.user)
        
        archived = self.request.query_params.get('archived')
        if archived == 'true':
            queryset = queryset.filter(archived=True)
        elif archived == 'false':
            queryset = queryset.filter(archived=False)
        # if archived == 'all' or not specified, return all leads
            
        return queryset

    def get_object(self):
        queryset = self.filter_queryset(Lead.objects.filter(user_id=self.request.user))
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        instance = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, instance)
        return instance

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

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)