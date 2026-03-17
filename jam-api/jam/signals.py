from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Group, JobApplication, JobAdSnapshot, Step, Timeline
from django.contrib.auth.models import User
import threading
from .utils import fetch_job_ad_snapshot


@receiver(post_save, sender=JobApplication)
def create_first_hist(sender, instance, created, **kwargs):
    if created:
        t = Timeline(
            user=instance.user,
            group=instance.group,
            step=instance.initial_step,
            application=instance,
            date=instance.date
        )
        t.save()


@receiver(post_save, sender=JobApplication)
def fetch_job_ad_snapshot(sender, instance, created, **kwargs):
    if not instance.external_link:
        return
    
    def fetch():
        text = fetch_job_ad_snapshot(instance.external_link)
        if text:
            JobAdSnapshot.objects.update_or_create(
                job_application=instance,
                defaults={'text': text}
            )
    
    thread = threading.Thread(target=fetch)
    thread.start()


@receiver(post_save, sender=User)
def create_default_resources(sender, instance, created, **kwargs):
    if created:
        applied = Step(type="S", name="Applied", color="#0072a3", user=instance)
        applied.save()

        hr_interview = Step(type="D", name="HR Interview", user=instance)
        hr_interview.save()

        tech_interview = Step(type="D", name="Technical Interview", user=instance)
        tech_interview.save()

        interview = Step(type="D", name="Interview", user=instance)
        interview.save()

        response = Step(type="D", name="Response", user=instance)
        response.save()

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
