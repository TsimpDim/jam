from django.db import models
from django.contrib.auth import get_user_model

class Group(models.Model):
    name = models.CharField(max_length=30, null=False)
    user = models.ForeignKey(get_user_model(),on_delete=models.CASCADE)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.user}.{self.name}"

class Step(models.Model):
    STEP_TYPES = (
        ('S', 'Start'),
        ('E', 'End'),
        ('D', 'Default')
    )
    name = models.CharField(max_length=30, null=False)
    type = models.CharField(max_length=1, choices=STEP_TYPES, null=False)
    notes = models.TextField(null=True, blank=True)
    user = models.ForeignKey(get_user_model(),on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user}.{self.name}"

class JobApplication(models.Model):
    company = models.CharField(max_length=40, null=False)
    role = models.CharField(max_length=40, null=False)
    date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=50, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    current_step = models.ForeignKey(Step, on_delete=models.DO_NOTHING, null=False)
    group = models.ForeignKey(Group, on_delete=models.DO_NOTHING, null=False)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

class Timeline(models.Model):
    group = models.ForeignKey(Group, on_delete=models.DO_NOTHING, null=False)
    user = models.ForeignKey(get_user_model(), on_delete=models.DO_NOTHING)
    step = models.ForeignKey(Step, on_delete=models.DO_NOTHING)
    application = models.ForeignKey(JobApplication, on_delete=models.DO_NOTHING)
    date = models.DateField(auto_now=True)
    notes = models.TextField(null=True, blank=True)
    completed = models.BooleanField(default=False)