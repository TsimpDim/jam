from django.contrib import admin
from .models import Group, Step, Lead, JobApplication, JobAdSnapshot, CV, UserProfile, Timeline

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'position')
    list_filter = ('user',)
    search_fields = ('name', 'user__username')


@admin.register(Step)
class StepAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'user', 'color')
    list_filter = ('type', 'user')
    search_fields = ('name', 'user__username')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('company', 'role', 'location', 'user', 'date', 'archived', 'group')
    list_filter = ('archived', 'user', 'group')
    search_fields = ('company', 'role', 'location')
    date_hierarchy = 'date'

    def delete_queryset(self, request, queryset):
        from .models import JobApplication
        JobApplication.objects.filter(lead__in=queryset).update(lead=None)
        super().delete_queryset(request, queryset)


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('company', 'role', 'location', 'user', 'date', 'initial_step', 'group', 'is_completed')
    list_filter = ('user', 'group', 'initial_step')
    search_fields = ('company', 'role', 'location')
    date_hierarchy = 'date'


@admin.register(JobAdSnapshot)
class JobAdSnapshotAdmin(admin.ModelAdmin):
    list_display = ('job_application', 'fetched_at')
    list_filter = ('fetched_at',)
    search_fields = ('job_application__company', 'job_application__role')
    date_hierarchy = 'fetched_at'


@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ('user', 'key', 'created_at', 'updated_at')
    list_filter = ('user',)
    search_fields = ('user__username', 'key')
    date_hierarchy = 'created_at'


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_premium')
    list_filter = ('is_premium',)
    search_fields = ('user__username',)


@admin.register(Timeline)
class TimelineAdmin(admin.ModelAdmin):
    list_display = ('application', 'step', 'group', 'user', 'date', 'date_relevant')
    list_filter = ('step', 'group', 'user', 'date_relevant')
    search_fields = ('application__company', 'application__role', 'user__username')
    date_hierarchy = 'date'
