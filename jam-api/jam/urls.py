from .views import GroupsViewSet, JobApplicationViewSet, StepViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'groups', GroupsViewSet, basename='group')
router.register(r'steps', StepViewSet, basename='step')
router.register(r'jobapps', JobApplicationViewSet, basename='jobapp')

urlpatterns = router.urls