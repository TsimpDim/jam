from django.db import models

class Group(models.Model):
    name = models.CharField(max_length=30, null=False)

class Step(models.Model):
    STEP_TYPES = (
        ('S', 'Start'),
        ('E', 'End'),
        ('D', 'Default')
    )
    name = models.CharField(max_length=30, null=False)
    date = models.DateField(null=True, blank=True)
    type = models.CharField(max_length=1, choices=STEP_TYPES, null=False)
    notes = models.TextField(null=True, blank=True)

class JobApplication(models.Model):
    company = models.CharField(max_length=40, null=False)
    role = models.CharField(max_length=40, null=False)
    date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=50, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    current_step = models.ForeignKey(Step, on_delete=models.DO_NOTHING, null=False)
    group = models.ForeignKey(Group, on_delete=models.DO_NOTHING, null=False)
