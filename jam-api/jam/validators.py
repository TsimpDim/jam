from django.core.exceptions import ValidationError

CV_LIMIT_FREE = 1
CV_LIMIT_PREMIUM = 10
MAX_CV_FILE_SIZE = 1 * 1024 * 1024  # 1MB
ALLOWED_CV_EXTENSIONS = ['.pdf', '.doc', '.docx']


def validate_cv_file(value):
    """Validate CV file extension and size."""
    ext = value.name.split('.')[-1].lower()
    if f'.{ext}' not in ALLOWED_CV_EXTENSIONS:
        raise ValidationError(
            f'Unsupported file type. Allowed types: {", ".join(ALLOWED_CV_EXTENSIONS)}'
        )
    if value.size > MAX_CV_FILE_SIZE:
        raise ValidationError(f'File size must not exceed 1MB.')
