from .views import GroupsViewSet, JobApplicationViewSet, StepViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'group', GroupsViewSet, basename='group')
router.register(r'step', StepViewSet, basename='step')
router.register(r'jobapp', JobApplicationViewSet, basename='jobapp')

urlpatterns = router.urls