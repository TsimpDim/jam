"""
Settings dispatcher.

When imported as `core.settings`, this module re-exports all settings
from `core.settings.base` for backward compatibility.

Use `core.settings.full` or `core.settings.lite` for explicit configurations.
"""

# Re-export base settings for backward compat (DJANGO_SETTINGS_MODULE=core.settings)
from core.settings.base import *  # noqa: F401,F403
