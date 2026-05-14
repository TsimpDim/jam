from .views import *
from rest_framework.routers import DefaultRouter
from django.urls import path, include

router = DefaultRouter()
router.register(r"groups", GroupsViewSet, basename="groups")
router.register(r"steps", StepViewSet, basename="steps")
router.register(r"jobapps", JobApplicationViewSet, basename="jobapps")
router.register(r"timeline", TimelineViewSet, basename="timeline")
router.register(r"leads", LeadViewSet, basename="leads")
router.register(r"cvs", CVViewSet, basename="cvs")

urlpatterns = [
    path("", include(router.urls)),
    path('analytics/', AnalyticsView.as_view(), name="analytics"),
    path('analytics/sankey/', SankeyView.as_view(), name="analytics-sankey"),
]
