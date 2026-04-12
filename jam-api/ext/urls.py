from .views import *
from rest_framework.routers import DefaultRouter
from django.urls import path, include

router = DefaultRouter()

urlpatterns = [
    path("", include(router.urls)),
    path('login', ExtensionLoginView.as_view(), name="login"),
    path('logout', ExtensionLogoutView.as_view(), name="logout"),
]
