from django.urls import include, path

urlpatterns = [
    path("extapi/", include("extapi.urls")),
]
