from django.core.exceptions import ValidationError

CV_LIMIT_FREE = 1
CV_LIMIT_PREMIUM = 10
MAX_CV_FILE_SIZE = 1 * 1024 * 1024  # 1MB
ALLOWED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx']

MAX_JOB_APP_FILE_SIZE = 300 * 1024 * 1024  # 300MB
JOB_APP_FILE_LIMIT_FREE = 5
JOB_APP_FILE_LIMIT_PREMIUM = 10
ALLOWED_JOB_APP_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
    '.txt', '.md', '.rtf', '.odt', '.ods', '.odp',
    '.csv', '.json', '.xml', '.yaml', '.yml',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.zip', '.rar', '.7z',
]

LEAD_GENERATION_LIMIT_PER_DAY_FREE = 1
CV_REVIEW_LIMIT_PER_DAY_FREE = 1


def validate_cv_file(value):
    """Validate CV file extension and size."""
    ext = value.name.split('.')[-1].lower()
    if f'.{ext}' not in ALLOWED_CV_EXTENSIONS:
        raise ValidationError(
            f'Unsupported file type. Allowed types: {", ".join(ALLOWED_CV_EXTENSIONS)}'
        )
    if value.size > MAX_CV_FILE_SIZE:
        raise ValidationError(f'File size must not exceed 1MB.')


def validate_job_app_file(value):
    """Validate job application file extension and size."""
    ext = value.name.split('.')[-1].lower()
    if f'.{ext}' not in ALLOWED_JOB_APP_EXTENSIONS:
        raise ValidationError(
            f'Unsupported file type ".{ext}". Allowed: PDF, Word, PPT, TXT, MD, images, archives, etc.'
        )
    if value.size > MAX_JOB_APP_FILE_SIZE:
        raise ValidationError(f'File size must not exceed 300MB.')
