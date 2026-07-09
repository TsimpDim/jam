import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Group, Lead, JobApplication, JobAdSnapshot, Step, Timeline, UserProfile
from django.contrib.auth.models import User
import threading
import jam.utils as utils


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=JobApplication)
def create_first_hist(sender, instance, created, **kwargs):
    if created and instance.initial_step is not None:
        t = Timeline(
            user=instance.user,
            group=instance.group,
            step=instance.initial_step,
            application=instance,
            date=instance.date
        )
        t.save()


@receiver(post_save, sender=JobApplication)
def create_job_ad_snapshot(sender, instance, created, **kwargs):
    print(f"fetch_job_ad_snapshot signal fired: created={created}, external_link={instance.external_link}")
    if instance.external_link is None:
        return
    
    def fetch():
        try:
            text = utils.fetch_job_ad_snapshot(instance.external_link)
            print(f"fetch result: {text[:100] if text else 'None'}")
            if text:
                JobAdSnapshot.objects.update_or_create(
                    job_application=instance,
                    defaults={'text': text}
                )
                print(f"Snapshot created/updated for job app {instance.id}")
        except Exception as e:
            print(f"Error creating snapshot: {e}")
    
    thread = threading.Thread(target=fetch)
    thread.start()


@receiver(post_save, sender=Lead)
def create_lead_snapshot(sender, instance, created, **kwargs):
    if instance.external_link is None or instance.external_link.strip() == '':
        return

    def fetch():
        try:
            from .models import LeadSnapshot
            text = utils.fetch_job_ad_snapshot(instance.external_link)
            if text:
                LeadSnapshot.objects.update_or_create(
                    lead=instance,
                    defaults={'text': text}
                )
                print(f"Snapshot created/updated for lead {instance.id}")
        except Exception as e:
            print(f"Error creating lead snapshot: {e}")

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
