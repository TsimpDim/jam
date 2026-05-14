from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import CVReview, Industry, ExperienceLevel, Role
from .serializers import CVReviewSerializer, IndustrySerializer, ExperienceLevelSerializer, RoleSerializer
from jam.models import CV, UserProfile


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

        # Check if CV belongs to user
        try:
            cv = CV.objects.get(id=cv_id, user=request.user)
        except CV.DoesNotExist:
            return Response({'error': 'CV not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if there's already a pending review for this CV
        pending_review = CVReview.objects.filter(user=request.user, cv=cv, is_done=False).first()
        if pending_review:
            return Response({'error': 'You already have a pending review for this CV.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check daily limit for non-premium users
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_premium:
            today = timezone.now().date()
            today_reviews = CVReview.objects.filter(user=request.user, created_at__date=today).count()
            if today_reviews >= 1:
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
