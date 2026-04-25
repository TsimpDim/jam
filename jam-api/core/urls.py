from django.contrib import admin
from django.urls import include, path
from jam.auth_views import LoginView, LogoutView, RegisterView, TokenView, TokenLogoutView, MeView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Web client (Django session)
    path('auth/login/',        LoginView.as_view(),       name='auth_login'),
    path('auth/logout/',       LogoutView.as_view(),      name='auth_logout'),
    # Extension (Knox token)
    path('auth/token/',        TokenView.as_view(),       name='auth_token'),
    path('auth/token/logout/', TokenLogoutView.as_view(), name='auth_token_logout'),
    # Shared
    path('auth/register/',     RegisterView.as_view(),    name='auth_register'),
    path('auth/me/',           MeView.as_view(),          name='auth_me'),
    # JAM
    path('jam/',               include('jam.urls')),
]
