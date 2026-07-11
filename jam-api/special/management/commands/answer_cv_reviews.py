from django.core.management.base import BaseCommand
from django.utils import timezone
from special.models import CVReview
from special.prompts import *
from special.aws_client import AwsClient
from jam.models import Notification, NotificationType


class Command(BaseCommand):
    help = 'Process pending CV review requests and generate review results.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting CV review processing...')

        pending_reviews = CVReview.objects.filter(is_done=False).select_related('cv', 'user', 'industry', 'experience_level').prefetch_related('roles')
        count = pending_reviews.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('No pending CV reviews to process.'))
            return

        self.stdout.write(f'Found {count} pending CV review(s) to process.')

        review: CVReview
        for review in pending_reviews:
            try:
                self.stdout.write(f'Processing review for CV: {review.cv.key} (User: {review.user.username})')

                role_names = [role.name for role in review.roles.all()]
                industry = review.industry.name
                experience_level = review.experience_level.name

                cv_bytes = review.cv.file.read()
                cv_format = review.cv.file.name.split('.')[-1].lower()
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "document": {
                                    "name": "Candidate_CV",
                                    "format": cv_format, 
                                    "source": {
                                        "bytes": cv_bytes
                                    }
                                }
                            },
                            {
                                "text": build_cv_review_prompt(role_names, industry, experience_level)
                            }
                        ]
                    }
                ]


                response = AwsClient.converse(messages)                    
                review.review_result = response
                review.is_done = True
                review.completed_at = timezone.now()
                review.save()

                notif_type = NotificationType.objects.get(code='cv_review_done')
                text = notif_type.text_template.format(industry=industry)
                Notification.objects.create(user=review.user, notification_type=notif_type, text=text)

                self.stdout.write(self.style.SUCCESS(f'Successfully processed review for CV: {review.cv.key}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing review for CV {review.cv.key}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS('CV review processing complete.'))
