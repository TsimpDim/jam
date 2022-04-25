from .views import GroupsViewSet, JobApplicationViewSet, StepViewSet, TimelineView
from rest_framework.routers import DefaultRouter
from django.urls import path, include

router = DefaultRouter()
router.register(r'groups', GroupsViewSet, basename='group')
router.register(r'steps', StepViewSet, basename='step')
router.register(r'jobapps', JobApplicationViewSet, basename='jobapp')

urlpatterns = [
    path('', include(router.urls)),
    path('timeline/<int:job_application_id>/', TimelineView.as_view(), name="app-timeline")
]