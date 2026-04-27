from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    RegisterView,
    TokenView,
    TokenLogoutView,
    MeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    # Web client (Django session)
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    # Extension (Knox token)
    path('token/', TokenView.as_view(), name='auth_token'),
    path('token/logout/', TokenLogoutView.as_view(), name='auth_token_logout'),
    # Shared
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('me/', MeView.as_view(), name='auth_me'),
    # Password reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]