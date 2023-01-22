from .views import GroupsViewSet, JobApplicationViewSet, StepViewSet, TimelineViewSet, AnalyticsView
from rest_framework.routers import DefaultRouter
from django.urls import path, include

router = DefaultRouter()
router.register(r"groups", GroupsViewSet, basename="group")
router.register(r"steps", StepViewSet, basename="step")
router.register(r"jobapps", JobApplicationViewSet, basename="jobapp")
router.register(r"timeline", TimelineViewSet, basename="timeline")

urlpatterns = [
    path("", include(router.urls)),
    path('analytics/', AnalyticsView.as_view(), name="analytics")
]
