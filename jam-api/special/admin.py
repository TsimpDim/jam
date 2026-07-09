from django.contrib import admin
from .models import CVReview, Industry, ExperienceLevel, LeadGenerationRequest, CoverLetterGenerationRequest, Role, City, Country


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

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name', 'slug')


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name', 'slug')


@admin.register(CVReview)
class CVReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'cv', 'industry', 'experience_level', 'is_done', 'created_at', 'completed_at')
    list_filter = ('is_done', 'industry', 'experience_level', 'user')
    search_fields = ('user__username', 'cv__key')
    date_hierarchy = 'created_at'
    filter_horizontal = ('roles',)

@admin.register(LeadGenerationRequest)
class LeadGenerationRequestAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "get_countries",
        "company_leads_only",
        "get_experience_levels",
        "get_modes",
        "get_company_sizes",
        "is_done",
        "created_at",
        "completed_at",
    )
    list_filter = (
        "is_done",
        "company_leads_only",
        "experience_level",
        "user",
    )
    search_fields = ("user__username",)
    date_hierarchy = "created_at"
    filter_horizontal = ("countries", "cities", "roles", "industries", "experience_level")
    readonly_fields = ("result", "created_at", "completed_at")
    fieldsets = (
        ("User", {"fields": ("user",)}),
        ("Countries & Cities", {"fields": ("countries", "cities")}),
        ("Job Preferences", {"fields": ("company_leads_only", "roles", "modes", "experience_level", "industries", "company_sizes")}),
        ("Result", {"fields": ("result", "is_done", "created_at", "completed_at"), "classes": ("collapse",)}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('countries', 'experience_level')

    @admin.display(description="Countries", ordering="user")
    def get_countries(self, obj):
        return ", ".join(c.name for c in obj.countries.all()[:3])

    @admin.display(description="Experience Level")
    def get_experience_levels(self, obj):
        return ", ".join(el.name for el in obj.experience_level.all()) or "—"

    @admin.display(description="Modes")
    def get_modes(self, obj):
        return ", ".join(obj.modes) if obj.modes else "—"

    @admin.display(description="Company Sizes")
    def get_company_sizes(self, obj):
        return ", ".join(obj.company_sizes) if obj.company_sizes else "—"


@admin.register(CoverLetterGenerationRequest)
class CoverLetterGenerationRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'cv', 'lead', 'is_done', 'created_at', 'completed_at')
    list_filter = ('is_done', 'user')
    search_fields = ('user__username', 'cv__key', 'lead__company')
    date_hierarchy = 'created_at'
    readonly_fields = ('result', 'created_at', 'completed_at')
