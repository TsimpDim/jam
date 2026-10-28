from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    MCPTokenDeleteView,
    MCPTokenListView,
    MCPTokenView,
    RegisterView,
    MeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    # Web client (Django session)
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    # Shared
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('me/', MeView.as_view(), name='auth_me'),
    # MCP
    path('mcp-token/list/', MCPTokenListView.as_view(), name='auth_mcp_token_list'),
    path('mcp-token/create/', MCPTokenView.as_view(), name='auth_mcp_token_create'),
    path('mcp-token/<str:token_key>/', MCPTokenDeleteView.as_view(), name='auth_mcp_token_delete'),
    # Password reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]