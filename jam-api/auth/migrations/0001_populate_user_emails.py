# Data migration to assign placeholder emails to existing users

from django.db import migrations


def populate_user_emails(apps, schema_editor):
    """Assign placeholder emails to existing users who don't have one."""
    User = apps.get_model("auth", "User")
    for user in User.objects.filter(email=""):
        user.email = f"{user.username}@placeholder.local"
        user.save(update_fields=["email"])


def reverse_populate(apps, schema_editor):
    """Reverse: clear placeholder emails."""
    User = apps.get_model("auth", "User")
    User.objects.filter(email__endswith="@placeholder.local").update(email="")


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RunPython(populate_user_emails, reverse_populate),
    ]
