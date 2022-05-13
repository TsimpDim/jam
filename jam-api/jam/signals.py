from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Group, JobApplication, Step, Timeline
from django.contrib.auth.models import User


@receiver(post_save, sender=JobApplication)
def create_first_hist(sender, instance, created, **kwargs):
    if created:
        t = Timeline(
            user=instance.user,
            group=instance.group,
            step=instance.initial_step,
            application=instance,
        )
        t.save()


@receiver(post_save, sender=User)
def create_default_resources(sender, instance, created, **kwargs):
    if created:
        applied = Step(type="S", name="Applied", color="#0072a3", user=instance)
        applied.save()

        interview = Step(type="D", name="Inteview", user=instance)
        interview.save()

        offer = Step(type="E", name="Offer", color="#038103", user=instance)
        offer.save()

        rejected = Step(type="E", name="Rejected", color="#ff5233", user=instance)
        rejected.save()

        group = Group(
            name="Default Group",
            description="Default group for your applications - feel free to delete it.",
            user=instance,
        )
        group.save()
