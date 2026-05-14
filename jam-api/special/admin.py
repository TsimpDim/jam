from django.contrib import admin
from .models import CVReview, Industry, ExperienceLevel, Role


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)


@admin.register(ExperienceLevel)
class ExperienceLevelAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    list_per_page = 50


@admin.register(CVReview)
class CVReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'cv', 'industry', 'experience_level', 'is_done', 'created_at', 'completed_at')
    list_filter = ('is_done', 'industry', 'experience_level', 'user')
    search_fields = ('user__username', 'cv__key')
    date_hierarchy = 'created_at'
    filter_horizontal = ('roles',)
