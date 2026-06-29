from datetime import datetime
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.db import models, transaction
from django.db.models import Max
from django.db.models.functions import TruncWeek, TruncMonth
from .serializers import (
    GroupSerializer,
    JobApplicationSerializer,
    JobAdSnapshotSerializer,
    StepSerializer,
    TimelineSerializer,
    LeadSerializer,
    CVSerializer
)
from .models import Group, JobApplication, JobAdSnapshot, Step, Timeline, Lead, CV, UserProfile
from .utils import remove_circular_links
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta

class GroupsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = GroupSerializer
    queryset = Group.objects.all()

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = self.request.user.id
        max_pos = Group.objects.filter(user=request.user).aggregate(Max('position'))['position__max'] or 0
        data["position"] = max_pos + 1
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def get_queryset(self):
        return Group.objects.filter(user_id=self.request.user).order_by('position', 'id')

    @action(detail=False, methods=['patch'])
    def reorder(self, request):
        groups_data = request.data.get('groups', [])
        for item in groups_data:
            Group.objects.filter(id=item['id'], user=request.user).update(position=item['position'])
        return Response({'status': 'ok'})


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
        groups = Group.objects.filter(user_id=self.request.user).order_by('position', '-id')
        
        sort_by = request.query_params.get('sort', 'id')
        if sort_by == '-id':
            order = '-id'
        elif sort_by == 'id':
            order = 'id'
        else:
            order = '-id'
        
        for group in groups.iterator():
            groupped_job_apps[group.name] = JobApplicationSerializer(
                JobApplication.objects.filter(group__id=group.id).order_by(order), many=True
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
        
        # Get group filter from query params
        group_id = request.query_params.get('group', None)
        
        # Base querysets
        total_jobapps = JobApplication.objects.filter(user=user)
        timelines = Timeline.objects.filter(user=user)
        leads = Lead.objects.filter(user=user)
        
        # Apply group filter if specified
        if group_id and group_id != 'all':
            total_jobapps = total_jobapps.filter(group_id=group_id)
            timelines = timelines.filter(application__group_id=group_id)
            leads = leads.filter(group_id=group_id)

        # Basic JobApps
        completed_jobapps = [jap for jap in total_jobapps.select_related('initial_step') if jap.is_completed()]
        completed_jobapps_count = len(completed_jobapps)
        pending_jobapps = total_jobapps.count() - completed_jobapps_count

        # Avg Steps per Application
        unique_applications_with_timelines = timelines.values('application_id').distinct().count()
        steps_per_app = timelines.count() / unique_applications_with_timelines if unique_applications_with_timelines > 0 else 0

        # Avg Time in-between Steps (days only)
        timelines_ordered = timelines.order_by('application_id', 'date')
        timelines_list = list(timelines_ordered)
        total_days_between = 0
        count_dates_used = 0
        for idx in range(len(timelines_list) - 1):
            timeline = timelines_list[idx]
            next_tl = timelines_list[idx + 1]
            # Only compare timelines within the same application
            if timeline.application_id == next_tl.application_id and timeline.date_relevant and next_tl.date_relevant:
                delta = (next_tl.date - timeline.date).days
                if delta >= 0:
                    total_days_between += delta
                    count_dates_used += 1
        
        avg_days_between_steps = f'{total_days_between / count_dates_used:.1f}' if count_dates_used > 0 else '0.0'

        # Applied Through breakdown
        all_applied_through_count = {}
        for at in total_jobapps.values_list('applied_through', flat=True).distinct():
            stored_key = at if at else 'empty'
            all_applied_through_count[stored_key] = total_jobapps.filter(applied_through=at).count()

        # Avg. time until completion (days only)
        total_days_to_completion = 0
        completed_count = 0
        for app in completed_jobapps:
            time_delta = app.time_took()
            total_days = time_delta.years * 365 + time_delta.months * 30 + time_delta.days
            total_days_to_completion += total_days
            completed_count += 1
        
        avg_days_to_completion = f'{total_days_to_completion / completed_count:.1f}' if completed_count > 0 else '0.0'

        # 2. Source Effectiveness (which sources lead to completion)
        source_effectiveness = {}
        for at in total_jobapps.values_list('applied_through', flat=True).distinct():
            stored_key = at if at else 'empty'
            apps_with_source = total_jobapps.filter(applied_through=at)
            completed_count = len([a for a in apps_with_source if a.is_completed()])
            source_effectiveness[stored_key] = {
                'total': apps_with_source.count(),
                'completed': completed_count,
                'conversion_rate': f'{(completed_count / apps_with_source.count() * 100):.1f}' if apps_with_source.count() > 0 else '0.0'
            }

        # 3. Total Leads
        total_leads = leads.count()
        
        # 4. Stage Duration (avg time spent at each step, in days)
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
                    delta = (next_tl.date - tl.date).days
                    if delta >= 0:
                        total_duration += delta
                        count += 1
            
            if count > 0:
                avg_days = total_duration / count
                stage_duration[step.name] = {
                    'avg_days': f'{avg_days:.1f}',
                    'color': step.color
                }

        # 5. Time Trends (applications per week/month)
        
        apps_by_week = total_jobapps.annotate(week=TruncWeek('date')).values('week').annotate(count=models.Count('id')).order_by('week')
        apps_by_month = total_jobapps.annotate(month=TruncMonth('date')).values('month').annotate(count=models.Count('id')).order_by('month')
        
        time_trends = {
            'weekly': [{'period': item['week'].strftime('%Y-%m-%d') if item['week'] else '', 'count': item['count']} for item in apps_by_week],
            'monthly': [{'period': item['month'].strftime('%Y-%m') if item['month'] else '', 'count': item['count']} for item in apps_by_month]
        }

        # 6. CV Usage breakdown (count of job apps per CV key)
        cv_used_count = {}
        for cv in CV.objects.filter(user=user):
            count = total_jobapps.filter(cv_used=cv).count()
            cv_used_count[cv.key] = count
        # Also count applications with no CV
        cv_used_count['Not specified'] = total_jobapps.filter(cv_used__isnull=True).count()

        # 7. CV Average Steps (average number of timeline steps per CV)
        cv_avg_steps = {}
        for cv in CV.objects.filter(user=user):
            apps_with_cv = total_jobapps.filter(cv_used=cv)
            if apps_with_cv.exists():
                app_ids = apps_with_cv.values_list('id', flat=True)
                steps_count = timelines.filter(application_id__in=app_ids).count()
                avg = steps_count / apps_with_cv.count()
                cv_avg_steps[cv.key] = f'{avg:.1f}'
        return Response({
            'totalJobApps': total_jobapps.count(),
            'completedJobApps': completed_jobapps_count,
            'pendingJobApps': pending_jobapps,
            'stepsPerApp': f'{steps_per_app:.1f}',
            'avgDaysBetweenSteps': avg_days_between_steps,
            'avgDaysToCompletion': avg_days_to_completion,
            'appliedThrough': all_applied_through_count,
            'sourceEffectiveness': source_effectiveness,
            'totalLeads': total_leads,
            'stageDuration': stage_duration,
            'timeTrends': time_trends,
            'cvUsed': cv_used_count,
            'cvAvgSteps': cv_avg_steps
        }, status=200)


class SankeyView(APIView):
    """API view for Sankey diagram data - separate from general analytics."""
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = self.request.user
        
        # Get group filter from query params
        group_id = request.query_params.get('group', None)
        
        # Base queryset
        total_jobapps = JobApplication.objects.filter(user=user)
        
        # Apply group filter if specified
        if group_id and group_id != 'all':
            total_jobapps = total_jobapps.filter(group_id=group_id)
        
        # Get all steps ordered by their position in the pipeline
        all_user_steps = Step.objects.filter(user=user).order_by('id')
        step_list = list(all_user_steps)
        
        # Build node list for Sankey
        sankey_nodes = []
        step_name_to_id = {}
        for idx, step in enumerate(step_list):
            sankey_nodes.append({'name': step.name, 'color': step.color})
            step_name_to_id[step.name] = idx
        
        # Add invisible "Drop-off" node to capture applications that don't progress
        # This ensures the first step's height reflects ALL applications
        dropoff_node_id = len(sankey_nodes)
        sankey_nodes.append({'name': 'Drop-off', 'color': 'transparent', 'invisible': True})
        
        # Prefetch all timelines in a single query to avoid N+1
        from collections import defaultdict
        all_timelines = list(
            Timeline.objects.filter(
                application__in=total_jobapps, date_relevant=True
            )
            .select_related('step')
            .order_by('application_id', 'date')
        )
        
        # Group timelines by application_id
        timelines_by_app = defaultdict(list)
        for tl in all_timelines:
            timelines_by_app[tl.application_id].append(tl)
        
        # Calculate flows between steps
        sankey_links = []
        applications = list(total_jobapps.all())
        
        for app in applications:
            app_timelines = timelines_by_app.get(app.id, [])
            
            if not app_timelines:
                # Application with no timelines - flows from first step to drop-off
                sankey_links.append({
                    'source': 0,  # First step
                    'target': dropoff_node_id,
                    'value': 1
                })
                continue
            
            # Track flows between consecutive steps
            for i in range(len(app_timelines)):
                current_step_name = app_timelines[i].step.name
                source_id = step_name_to_id.get(current_step_name)
                
                if source_id is None:
                    continue
                
                if i == len(app_timelines) - 1:
                    # Last step for this application
                    if app_timelines[i].step.type != 'E':
                        # Not an end step - flows to drop-off
                        sankey_links.append({
                            'source': source_id,
                            'target': dropoff_node_id,
                            'value': 1
                        })
                else:
                    # Flow to next step
                    next_step_name = app_timelines[i + 1].step.name
                    target_id = step_name_to_id.get(next_step_name)
                    if target_id is not None:
                        sankey_links.append({
                            'source': source_id,
                            'target': target_id,
                            'value': 1
                        })
        
        # Aggregate links (combine duplicate source->target pairs)
        aggregated_links = {}
        for link in sankey_links:
            key = f"{link['source']}->{link['target']}"
            if key in aggregated_links:
                aggregated_links[key]['value'] += 1
            else:
                aggregated_links[key] = link
        
        # Remove circular links using topological sort (Kahn's algorithm)
        aggregated_links = remove_circular_links(aggregated_links)
        
        sankey_data = {
            'nodes': sankey_nodes,
            'links': list(aggregated_links.values())
        }
        
        return Response(sankey_data, status=200)

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


    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.applications.update(lead=None)
        return super().destroy(request, *args, **kwargs)


class CVViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CVSerializer

    def get_queryset(self):
        return CV.objects.filter(user_id=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        # Check CV limit inside a transaction to prevent race conditions
        with transaction.atomic():
            user_profile = UserProfile.objects.select_for_update().get(user=request.user)
            cv_limit = user_profile.get_user_cv_limit()
            current_cv_count = CV.objects.filter(user=request.user).count()
            
            if current_cv_count >= cv_limit:
                return Response(
                    {'error': f'CV limit reached. Maximum {cv_limit} CVs allowed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = request.data.copy()
            data["user"] = request.user.id
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Handle file upload separately since it comes as multipart/form-data
        if request.FILES.get('file'):
            instance.file = request.FILES['file']
        
        # Update key if provided
        if 'key' in request.data:
            instance.key = request.data['key']
        
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Store file reference for deletion after DB record is removed
        file_to_delete = instance.file
        response = super().destroy(request, *args, **kwargs)
        
        # Delete the file from storage after successful DB deletion
        if file_to_delete:
            file_to_delete.delete(save=False)
        
        return response

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        cv = self.get_object()
        if not cv.file:
            return Response({'error': 'No file attached to this CV.'}, status=status.HTTP_404_NOT_FOUND)
        file_handle = cv.file.open('rb')
        filename = cv.file.name.split('/')[-1]
        response = FileResponse(file_handle, as_attachment=True, filename=filename)
        return response