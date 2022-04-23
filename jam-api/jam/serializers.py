from dataclasses import fields
from rest_framework import serializers
from .models import Group, JobApplication, Step

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = '__all__'

class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = '__all__'

class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = '__all__'