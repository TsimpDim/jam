from datetime import datetime
from django.db import models
from django.contrib.auth.models import User


class Group(models.Model):
    name = models.CharField(max_length=30, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.user}.{self.name}"


class Step(models.Model):
    STEP_TYPES = (("S", "Start"), ("E", "End"), ("D", "Default"))

    DEFAULT_COLOR = "#8c8c8c"
    name = models.CharField(max_length=30, null=False)
    type = models.CharField(max_length=1, choices=STEP_TYPES, null=False)
    notes = models.TextField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    color = models.CharField(max_length=7, default=DEFAULT_COLOR)

    def __str__(self):
        return f"{self.user}.{self.name}"


class JobApplication(models.Model):
    company = models.CharField(max_length=40, null=False)
    role = models.CharField(max_length=40, null=False)
    date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=50, null=True, blank=True)
    applied_through = models.CharField(max_length=50, null=True, blank=True)
    external_link = models.URLField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    initial_step = models.ForeignKey(Step, on_delete=models.DO_NOTHING, null=False)
    group = models.ForeignKey(Group, on_delete=models.DO_NOTHING, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def is_completed(self):
        tl = self.timeline_set.last()
        return tl and tl.step.type == "E"


class Timeline(models.Model):
    group = models.ForeignKey(Group, on_delete=models.DO_NOTHING, null=False)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    step = models.ForeignKey(Step, on_delete=models.DO_NOTHING)
    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE)
    date = models.DateField()
    notes = models.TextField(null=True, blank=True)

    # This is done so that if we give a date, it is set
    # and if we don't, then it is set automatically (for the signal to work)
    def save(self, *args, **kwargs):
        if self.date is None:
            self.date = datetime.now()

        super().save(*args, **kwargs)
