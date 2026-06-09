"""
Shared Django settings for both full and lite configurations.

Imported by both core.settings.full and core.settings.lite.
"""

import os
from datetime import timedelta
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = False if not os.getenv("DEBUG") else True

ALLOWED_HOSTS = ["localhost", "api.jam.local", "api.jam-app.com", "127.0.0.1"]

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:81",
    "http://127.0.0.1:8000",
    "http://localhost:8001",
    "http://localhost:8002",
    "http://client.jam.local:81",
    "https://dashboard.jam-app.com",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:81",
    "https://dashboard.jam-app.com",
]

# Cookie settings for cross-subdomain access
if DEBUG:
    CSRF_COOKIE_DOMAIN = None
    CSRF_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SECURE = False
    CSRF_COOKIE_HTTPONLY = False

    SESSION_COOKIE_DOMAIN = None
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False
else:
    CSRF_COOKIE_DOMAIN = ".jam-app.com"
    CSRF_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = False

    SESSION_COOKIE_DOMAIN = ".jam-app.com"
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOW_CREDENTIALS = True

# Shared
INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "knox",
    "jam",
    "auth",
    "special",
    "extapi",
]

# Shared
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# Shared
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": 3306,
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Knox token settings (shared base)
REST_KNOX = {
    "TOKEN_TTL": timedelta(hours=24),
    "AUTO_REFRESH": True,
    "AUTO_REFRESH_MAX_TTL": timedelta(days=30),
    "TOKEN_LIMIT_PER_USER": 5,
}

# Email / SMTP Configuration
EMAIL_HOST = os.getenv("JAM_EMAIL_HOST", "jam.com")
EMAIL_PORT = int(os.getenv("JAM_EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("JAM_EMAIL_USE_TLS", "True")
EMAIL_HOST_USER = os.getenv("JAM_EMAIL_HOST_USER", "jam@local.com")
EMAIL_HOST_PASSWORD = os.getenv("JAM_EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("JAM_DEFAULT_FROM_EMAIL", "jam@local.com")

# Frontend URL (used in password reset links)
FRONTEND_URL = os.getenv("JAM_FRONTEND_URL", "http://localhost:81")
