from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CVReviewViewSet, LeadGenerationRequestViewSet, ScheduledLeadGenerationRequestViewSet, CoverLetterGenerationRequestViewSet, IndustryViewSet, ExperienceLevelViewSet, RoleViewSet, CountryViewSet, CityViewSet

router = DefaultRouter()
router.register(r'cv-reviews', CVReviewViewSet, basename='cv-reviews')
router.register(r'lead-generation-requests', LeadGenerationRequestViewSet, basename='lead-generation-requests')
router.register(r'scheduled-lead-generation', ScheduledLeadGenerationRequestViewSet, basename='scheduled-lead-generation')
router.register(r'cover-letter-requests', CoverLetterGenerationRequestViewSet, basename='cover-letter-requests')
router.register(r'industries', IndustryViewSet, basename='industries')
router.register(r'roles', RoleViewSet, basename='roles')
router.register(r'experience-levels', ExperienceLevelViewSet, basename='experience-levels')
router.register(r'countries', CountryViewSet, basename='countries')
router.register(r'cities', CityViewSet, basename='cities')

urlpatterns = [
    path('', include(router.urls)),
]
