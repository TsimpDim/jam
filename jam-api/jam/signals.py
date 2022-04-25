from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import JobApplication, Timeline

@receiver(post_save, sender=JobApplication)
def create_first_hist(sender, instance, created, **kwargs):
    if created:
        t = Timeline(
            user = instance.user,
            group = instance.group,
            step = instance.current_step,
            application = instance
        )
        t.save()