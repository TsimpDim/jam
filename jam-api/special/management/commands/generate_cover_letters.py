from django.core.management.base import BaseCommand
from django.utils import timezone
from special.models import CoverLetterGenerationRequest
from special.prompts import build_cover_letter_prompt
from special.aws_client import AwsClient


class Command(BaseCommand):
    help = 'Process pending cover letter generation requests.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting cover letter generation...')

        pending_requests = CoverLetterGenerationRequest.objects.filter(
            is_done=False
        ).select_related('cv', 'lead', 'user')
        count = pending_requests.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('No pending cover letter requests to process.'))
            return

        self.stdout.write(f'Found {count} pending cover letter request(s) to process.')

        for request in pending_requests:
            try:
                self.stdout.write(
                    f'Processing cover letter for lead "{request.lead.company}" '
                    f'with CV "{request.cv.key}" (User: {request.user.username})'
                )

                cv_bytes = request.cv.file.read()
                cv_format = request.cv.file.name.split('.')[-1].lower()

                snapshot_text = ''
                try:
                    snap = request.lead.snapshot
                    snapshot_text = snap.text
                except Exception:
                    pass

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
                                "text": build_cover_letter_prompt(
                                    company=request.lead.company,
                                    role=request.lead.role or '',
                                    location=request.lead.location or '',
                                    notes=request.lead.notes or '',
                                    snapshot_text=snapshot_text,
                                )
                            }
                        ]
                    }
                ]

                response = AwsClient.converse(messages)
                request.result = response
                request.is_done = True
                request.completed_at = timezone.now()
                request.save()

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully generated cover letter for lead "{request.lead.company}"'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error generating cover letter for lead "{request.lead.company}": {str(e)}'
                    )
                )

        self.stdout.write(self.style.SUCCESS('Cover letter generation processing complete.'))
