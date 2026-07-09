from django.db import models
from django.contrib.auth.models import User
from jam.models import CV, Lead


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


class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    code = models.CharField(max_length=2, unique=True, help_text="ISO 3166-1 alpha-2 code")

    class Meta:
        ordering = ['name']
        verbose_name_plural = "Countries"

    def __str__(self):
        return self.name


class City(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='cities', null=True, blank=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = "Cities"

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
        verbose_name_plural = "CV reviews"

    def __str__(self):
        return f"{self.user.username} - {self.cv.key} - {self.industry.name}"


class LeadGenerationRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lead_generation_requests')
    countries = models.ManyToManyField(Country, related_name='lead_requests', blank=True)
    cities = models.ManyToManyField(City, related_name='lead_requests', blank=True)
    company_leads_only = models.BooleanField(default=False)
    roles = models.ManyToManyField(Role, related_name='lead_requests', blank=True)
    modes = models.JSONField(default=list)
    experience_level = models.ManyToManyField(ExperienceLevel, related_name='lead_requests', blank=True)
    industries = models.ManyToManyField(Industry, related_name='lead_requests', blank=True)
    company_sizes = models.JSONField(default=list)
    result = models.TextField(null=True, blank=True)
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        locs = ", ".join([c.name for c in self.countries.all()[:3]])
        return f"{self.user.username} - {locs}" if locs else self.user.username


class CoverLetterGenerationRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cover_letter_requests')
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='cover_letter_requests')
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='cover_letter_requests')
    result = models.TextField(null=True, blank=True)
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.cv.key} - {self.lead.company}"
