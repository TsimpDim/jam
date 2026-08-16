from django.core.management.base import BaseCommand
from django.utils import timezone
from special.models import ScheduledLeadGenerationRequest


class Command(BaseCommand):
    help = 'Create lead generation requests for due daily schedules.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Checking daily lead generation schedules...')

        schedules = ScheduledLeadGenerationRequest.objects.filter(
            user__profile__is_premium=True
        )
        created_count = 0
        today = timezone.localdate()

        for schedule in schedules:
            last_request = schedule.last_generation_request
            print(last_request)
            if last_request is None or last_request.created_at.date() < today:
                schedule.create_generation_request()
                created_count += 1
                self.stdout.write(
                    f'  Created new lead generation request for user: {schedule.user.username}'
                )

        if created_count == 0:
            self.stdout.write(self.style.SUCCESS('No daily lead generation requests due.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Created {created_count} daily lead generation request(s).'))
