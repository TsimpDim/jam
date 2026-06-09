from rest_framework.serializers import CharField, ModelSerializer, Serializer, ValidationError

from jam.models import Group, JobApplication, Lead, Step


class ExtensionLoginSerializer(Serializer):
    username = CharField()
    password = CharField(write_only=True)

    def validate(self, attrs):
        if not attrs.get("username"):
            raise ValidationError({"username": "Username is required."})
        if not attrs.get("password"):
            raise ValidationError({"password": "Password is required."})
        return attrs


class GroupSerializer(ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]


class StepSerializer(ModelSerializer):
    class Meta:
        model = Step
        fields = ["id", "name", "type"]


class LeadSerializer(ModelSerializer):
    class Meta:
        model = Lead
        fields = ["id", "company", "role", "location", "external_link", "notes"]


class AddLeadSerializer(ModelSerializer):
    class Meta:
        model = Lead
        fields = ["company", "role", "location", "external_link", "notes"]


class JobApplicationSerializer(ModelSerializer):
    class Meta:
        model = JobApplication
        fields = [
            "id", "company", "role", "location",
            "applied_through", "external_link", "notes",
            "group", "initial_step", "lead",
        ]
