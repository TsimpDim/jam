from django.db import models
from django.contrib.auth.models import User
from jam.models import CV


class Industry(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = "Industries"
        ordering = ['name']

    def __str__(self):
        return self.name


class ExperienceLevel(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class CVReview(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cv_review_requests')
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='review_requests')
    industry = models.ForeignKey(Industry, on_delete=models.PROTECT, null=False, blank=False)
    experience_level = models.ForeignKey(ExperienceLevel, on_delete=models.PROTECT, null=False, blank=False)
    roles = models.ManyToManyField(Role, related_name='cv_review_requests')
    review_result = models.TextField(null=True, blank=True)
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.cv.key} - {self.industry.name}"
