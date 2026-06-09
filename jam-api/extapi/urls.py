from django.urls import path

from extapi.views import (
    AddApplicationView,
    AddLeadView,
    ExtensionLoginView,
    ExtensionLogoutView,
    GroupListView,
    LeadListView,
    StepListView,
)

urlpatterns = [
    path("auth/login/", ExtensionLoginView.as_view(), name="ext-login"),
    path("auth/logout/", ExtensionLogoutView.as_view(), name="ext-logout"),
    path("groups/", GroupListView.as_view(), name="ext-groups"),
    path("steps/", StepListView.as_view(), name="ext-steps"),
    path("leads/", LeadListView.as_view(), name="ext-leads"),
    path("leads/add/", AddLeadView.as_view(), name="ext-add-lead"),
    path("applications/add/", AddApplicationView.as_view(), name="ext-add-application"),
]
