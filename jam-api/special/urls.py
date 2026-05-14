from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CVReviewViewSet, IndustryViewSet, ExperienceLevelViewSet, RoleViewSet

router = DefaultRouter()
router.register(r'cv-reviews', CVReviewViewSet, basename='cv-reviews')
router.register(r'industries', IndustryViewSet, basename='industries')
router.register(r'roles', RoleViewSet, basename='roles')
router.register(r'experience-levels', ExperienceLevelViewSet, basename='experience-levels')

urlpatterns = [
    path('', include(router.urls)),
]
