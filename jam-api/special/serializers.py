from rest_framework import serializers
from .models import CVReview, Industry, ExperienceLevel, Role


class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Industry
        fields = ['id', 'name', 'slug']


class ExperienceLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceLevel
        fields = ['id', 'name', 'slug']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'slug']


class CVReviewSerializer(serializers.ModelSerializer):
    cv_key = serializers.CharField(source='cv.key', read_only=True)
    cv_file = serializers.CharField(source='cv.file', read_only=True)
    industry = serializers.PrimaryKeyRelatedField(queryset=Industry.objects.all())
    experience_level = serializers.PrimaryKeyRelatedField(queryset=ExperienceLevel.objects.all())
    roles = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), many=True)
    industry_name = serializers.CharField(source='industry.name', read_only=True)
    experience_level_name = serializers.CharField(source='experience_level.name', read_only=True)
    roles_names = serializers.SerializerMethodField()

    def get_roles_names(self, obj):
        return [role.name for role in obj.roles.all()]

    class Meta:
        model = CVReview
        fields = [
            'id', 'cv', 'cv_key', 'cv_file',
            'industry', 'industry_name',
            'experience_level', 'experience_level_name',
            'roles', 'roles_names',
            'review_result', 'is_done',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'review_result', 'is_done', 'created_at', 'completed_at', 'cv_key', 'cv_file', 'industry_name', 'experience_level_name', 'roles_names']
