"""
Lite app settings.

Minimal configuration for the extension API with token-only authentication.
Used by the api-lite service (port 8002).
"""

from core.settings.base import *

INSTALLED_APPS = [app for app in INSTALLED_APPS if app not in (
    "django.contrib.admin",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "core",
)]

# Minimal middleware: CORS + Common only (no sessions, no CSRF, no auth middleware)
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "core.urls_extapi"

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

# Token-only authentication
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "knox.auth.TokenAuthentication",
    ),
}

# Extended token TTL for extension usage
REST_KNOX.update({
    "TOKEN_TTL": timedelta(days=30),
    "AUTO_REFRESH_MAX_TTL": timedelta(days=90),
    "TOKEN_LIMIT_PER_USER": 10,
})

# No password validation needed (token-only)
AUTH_PASSWORD_VALIDATORS = []

# No templates needed (API only)
TEMPLATES = []
