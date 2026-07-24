from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import CVReview, LeadGenerationRequest, CoverLetterGenerationRequest, Industry, ExperienceLevel, Role, Country, City
from .serializers import CVReviewSerializer, LeadGenerationRequestSerializer, CoverLetterGenerationRequestSerializer, IndustrySerializer, ExperienceLevelSerializer, RoleSerializer, CountrySerializer, CitySerializer
from jam.models import CV, Lead, UserProfile
from jam.validators import CV_REVIEW_LIMIT_PER_DAY_FREE, LEAD_GENERATION_LIMIT_PER_DAY_FREE


class IndustryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = IndustrySerializer
    queryset = Industry.objects.all()


class ExperienceLevelViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ExperienceLevelSerializer
    queryset = ExperienceLevel.objects.all()


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = RoleSerializer
    queryset = Role.objects.all()

    def get_queryset(self):
        queryset = Role.objects.all()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CountrySerializer
    queryset = Country.objects.all()


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CitySerializer
    queryset = City.objects.select_related('country').all()

    def get_queryset(self):
        queryset = City.objects.select_related('country').all()
        country = self.request.query_params.get('country')
        if country:
            queryset = queryset.filter(country__slug=country)
        return queryset


class CVReviewViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CVReviewSerializer

    def get_queryset(self):
        qs = CVReview.objects.filter(user=self.request.user).prefetch_related('roles').select_related('cv', 'industry', 'experience_level')
        cv_id = self.request.query_params.get('cv')
        if cv_id:
            qs = qs.filter(cv_id=cv_id)
        return qs

    def create(self, request, *args, **kwargs):
        cv_id = request.data.get('cv')
        if not cv_id:
            return Response({'error': 'CV ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cv = CV.objects.get(id=cv_id, user=request.user)
        except CV.DoesNotExist:
            return Response({'error': 'CV not found.'}, status=status.HTTP_404_NOT_FOUND)

        pending_review = CVReview.objects.filter(user=request.user, cv=cv, is_done=False).first()
        if pending_review:
            return Response({'error': 'You already have a pending review for this CV.'}, status=status.HTTP_400_BAD_REQUEST)

        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_premium:
            today = timezone.now().date()
            today_reviews = CVReview.objects.filter(user=request.user, created_at__date=today).count()
            if today_reviews >= CV_REVIEW_LIMIT_PER_DAY_FREE:
                return Response({'error': 'Free users can only request 1 CV review per day.'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data["user"] = request.user.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LeadGenerationRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = LeadGenerationRequestSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = LeadGenerationRequest.objects.filter(
            user=self.request.user
        ).prefetch_related(
            'roles', 'countries', 'cities',
            'industries', 'experience_level',
        )
        return qs

    def create(self, request, *args, **kwargs):
        countries = request.data.get('countries')
        if not countries or len(countries) == 0:
            return Response({'error': 'At least one country is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_premium:
            today = timezone.now().date()
            today_requests = LeadGenerationRequest.objects.filter(user=request.user, created_at__date=today).count()
            if today_requests >= LEAD_GENERATION_LIMIT_PER_DAY_FREE:
                return Response({'error': 'Free users can only request 1 lead generation per day.'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data["user"] = request.user.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CoverLetterGenerationRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CoverLetterGenerationRequestSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return CoverLetterGenerationRequest.objects.filter(
            user=self.request.user
        ).select_related('cv', 'lead')

    def create(self, request, *args, **kwargs):
        cv_id = request.data.get('cv')
        lead_id = request.data.get('lead')

        if not cv_id:
            return Response({'error': 'CV ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not lead_id:
            return Response({'error': 'Lead ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cv = CV.objects.get(id=cv_id, user=request.user)
        except CV.DoesNotExist:
            return Response({'error': 'CV not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            lead = Lead.objects.get(id=lead_id, user=request.user)
        except Lead.DoesNotExist:
            return Response({'error': 'Lead not found.'}, status=status.HTTP_404_NOT_FOUND)

        pending_request = CoverLetterGenerationRequest.objects.filter(
            user=request.user, lead=lead, is_done=False
        ).first()
        if pending_request:
            return Response(
                {'error': 'You already have a pending cover letter generation for this lead.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_premium:
            today = timezone.now().date()
            today_requests = CoverLetterGenerationRequest.objects.filter(
                user=request.user, created_at__date=today
            ).count()
            if today_requests >= LEAD_GENERATION_LIMIT_PER_DAY_FREE:
                return Response(
                    {'error': 'Free users can only request 1 cover letter per day.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        data = request.data.copy()
        data["user"] = request.user.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
