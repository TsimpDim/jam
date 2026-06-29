from rest_framework import serializers
from .models import CVReview, LeadGenerationRequest, Industry, ExperienceLevel, Role, Country, City


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


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name', 'slug', 'code']


class CitySerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)

    class Meta:
        model = City
        fields = ['id', 'name', 'slug', 'country', 'country_name']


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


class LeadGenerationRequestSerializer(serializers.ModelSerializer):
    countries = serializers.PrimaryKeyRelatedField(queryset=Country.objects.all(), many=True, required=False)
    cities = serializers.PrimaryKeyRelatedField(queryset=City.objects.all(), many=True, required=False)
    roles = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), many=True, required=False)
    industries = serializers.PrimaryKeyRelatedField(queryset=Industry.objects.all(), many=True, required=False)
    experience_level = serializers.PrimaryKeyRelatedField(queryset=ExperienceLevel.objects.all(), many=True, required=False)
    countries_names = serializers.SerializerMethodField()
    cities_names = serializers.SerializerMethodField()
    roles_names = serializers.SerializerMethodField()
    industries_names = serializers.SerializerMethodField()
    experience_level_names = serializers.SerializerMethodField()

    def get_countries_names(self, obj):
        return [c.name for c in obj.countries.all()]

    def get_cities_names(self, obj):
        return [c.name for c in obj.cities.all()]

    def get_roles_names(self, obj):
        return [role.name for role in obj.roles.all()]

    def get_industries_names(self, obj):
        return [ind.name for ind in obj.industries.all()]

    def get_experience_level_names(self, obj):
        return [el.name for el in obj.experience_level.all()]

    class Meta:
        model = LeadGenerationRequest
        fields = [
            'id',
            'countries', 'countries_names',
            'cities', 'cities_names',
            'company_leads_only',
            'roles', 'roles_names',
            'modes', 'experience_level', 'experience_level_names',
            'industries', 'industries_names',
            'company_sizes',
            'result', 'is_done',
            'created_at', 'completed_at'
        ]
        read_only_fields = [
            'id',
            'countries_names', 'cities_names', 'roles_names', 'industries_names', 'experience_level_names',
            'result', 'is_done', 'created_at', 'completed_at'
        ]
