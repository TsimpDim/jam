from rest_framework import serializers
from .models import Group, JobApplication, Step, Timeline, Lead


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = "__all__"


class JobApplicationSerializer(serializers.ModelSerializer):

    status = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    last_step_color = serializers.SerializerMethodField()

    def get_group_name(self, obj):
        return obj.group.name

    def get_status(self, obj):
        if obj.is_completed():
            return "COMPLETED"
        else:
            return "IN PROGRESS"
    
    def get_last_step_color(self, obj):
        last_tl = Timeline.objects.filter(application_id=obj.id).last()
        return last_tl and last_tl.step.color

    class Meta:
        model = JobApplication
        fields = "__all__"


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = "__all__"


class TimelineSerializer(serializers.ModelSerializer):
    step = serializers.SerializerMethodField()

    def get_step(self, obj):
        return StepSerializer(obj.step, many=False).data

    class Meta:
        model = Timeline
        fields = "__all__"

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = "__all__"