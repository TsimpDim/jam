from datetime import date, timedelta
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from special.models import (
    Industry, ExperienceLevel, Role, Country, City,
    CVReview, LeadGenerationRequest, ScheduledLeadGenerationRequest,
    CoverLetterGenerationRequest,
)
from jam.models import CV, Lead, UserProfile, Group, Notification


class ReferenceDataViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_industries(self):
        Industry.objects.create(name="ZTestIndustry", slug="z-test-industry")
        resp = self.client.get("/special/industries/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_list_experience_levels(self):
        ExperienceLevel.objects.create(name="ZTestLevel", slug="z-test-level")
        resp = self.client.get("/special/experience-levels/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_list_roles(self):
        Role.objects.create(name="ZTestRole", slug="z-test-role")
        resp = self.client.get("/special/roles/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_roles_search(self):
        Role.objects.create(name="SpecificTestRole", slug="specific-test-role")
        resp = self.client.get("/special/roles/?search=SpecificTestRole")
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["name"], "SpecificTestRole")

    def test_list_countries(self):
        Country.objects.create(name="ZTestCountry", slug="z-test-country", code="ZC")
        resp = self.client.get("/special/countries/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_list_cities(self):
        country = Country.objects.create(name="ZTestCountry", slug="z-test-country", code="ZC")
        City.objects.create(name="ZTestCity", slug="z-test-city", country=country)
        resp = self.client.get("/special/cities/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_cities_filter_by_country(self):
        tc = Country.objects.create(name="TestCountry", slug="test-country", code="TC")
        other = Country.objects.create(name="OtherCountry", slug="other-country", code="OC")
        City.objects.create(name="CityA", slug="city-a", country=tc)
        City.objects.create(name="CityB", slug="city-b", country=other)
        resp = self.client.get("/special/cities/?country=test-country")
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["name"], "CityA")


class CVReviewViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.cv = CV.objects.create(user=self.user, key="My CV")
        self.industry = Industry.objects.create(name="TestIndustry", slug="test-industry")
        self.experience = ExperienceLevel.objects.create(name="TestLevel", slug="test-level")
        self.role = Role.objects.create(name="TestRole", slug="test-role")

    def test_create_cv_review(self):
        resp = self.client.post("/special/cv-reviews/", {
            "cv": self.cv.id,
            "industry": self.industry.id,
            "experience_level": self.experience.id,
            "roles": [self.role.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_create_cv_review_missing_cv(self):
        resp = self.client.post("/special/cv-reviews/", {
            "industry": self.industry.id,
            "experience_level": self.experience.id,
            "roles": [self.role.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_cv_review_cv_not_found(self):
        resp = self.client.post("/special/cv-reviews/", {
            "cv": 9999,
            "industry": self.industry.id,
            "experience_level": self.experience.id,
            "roles": [self.role.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_cv_review_duplicate_pending(self):
        CVReview.objects.create(
            user=self.user, cv=self.cv,
            industry=self.industry, experience_level=self.experience, is_done=False,
        )
        resp = self.client.post("/special/cv-reviews/", {
            "cv": self.cv.id,
            "industry": self.industry.id,
            "experience_level": self.experience.id,
            "roles": [self.role.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pending review", resp.data["error"].lower())

    def test_free_user_daily_limit(self):
        CVReview.objects.create(
            user=self.user, cv=self.cv,
            industry=self.industry, experience_level=self.experience,
            created_at=timezone.now(),
        )
        resp = self.client.post("/special/cv-reviews/", {
            "cv": self.cv.id,
            "industry": self.industry.id,
            "experience_level": self.experience.id,
            "roles": [self.role.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_premium_user_no_daily_limit(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        # Existing completed review (not pending) - premium should still bypass daily limit
        CVReview.objects.create(
            user=self.user, cv=self.cv,
            industry=self.industry, experience_level=self.experience,
            created_at=timezone.now(), is_done=True,
        )
        # Use a different CV to avoid "pending review" conflict
        cv2 = CV.objects.create(user=self.user, key="CV 2")
        resp = self.client.post("/special/cv-reviews/", {
            "cv": cv2.id,
            "industry": self.industry.id,
            "experience_level": self.experience.id,
            "roles": [self.role.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list_cv_reviews(self):
        CVReview.objects.create(
            user=self.user, cv=self.cv,
            industry=self.industry, experience_level=self.experience,
        )
        resp = self.client.get("/special/cv-reviews/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_list_cv_reviews_filter_by_cv(self):
        cv2 = CV.objects.create(user=self.user, key="CV 2")
        CVReview.objects.create(
            user=self.user, cv=self.cv,
            industry=self.industry, experience_level=self.experience,
        )
        CVReview.objects.create(
            user=self.user, cv=cv2,
            industry=self.industry, experience_level=self.experience,
        )
        resp = self.client.get(f"/special/cv-reviews/?cv={self.cv.id}")
        self.assertEqual(len(resp.data), 1)

    def test_user_isolation(self):
        other = User.objects.create_user(username="bob", password="pass")
        other_cv = CV.objects.create(user=other, key="Other CV")
        CVReview.objects.create(
            user=other, cv=other_cv,
            industry=self.industry, experience_level=self.experience,
        )
        resp = self.client.get("/special/cv-reviews/")
        self.assertEqual(len(resp.data), 0)


class LeadGenerationRequestViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.country = Country.objects.create(name="TestCountry", slug="test-country", code="TC")

    def test_create_lead_request(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_create_lead_request_with_num_leads_and_comment(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
            "num_leads": 10,
            "additional_comment": "  Only fintech startups  ",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        req = LeadGenerationRequest.objects.get(id=resp.data["id"])
        self.assertEqual(req.num_leads, 10)
        self.assertEqual(req.additional_comment, "Only fintech startups")

    def test_create_lead_request_default_num_leads(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["num_leads"], 15)

    def test_create_lead_request_num_leads_too_low(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
            "num_leads": 0,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_lead_request_num_leads_too_high(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
            "num_leads": 16,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_lead_request_comment_too_long(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
            "additional_comment": "x" * 501,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_lead_request_whitespace_comment_stored_as_null(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
            "additional_comment": "   ",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        req = LeadGenerationRequest.objects.get(id=resp.data["id"])
        self.assertIsNone(req.additional_comment)

    def test_create_lead_request_invalid_modes(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
            "modes": ["On-Site", "Teleportation"],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_lead_request_invalid_company_sizes(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
            "company_sizes": ["Galactic"],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_lead_request_no_countries(self):
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_free_user_daily_limit(self):
        LeadGenerationRequest.objects.create(
            user=self.user, created_at=timezone.now(),
        )
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_premium_user_no_limit(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        LeadGenerationRequest.objects.create(
            user=self.user, created_at=timezone.now(),
        )
        resp = self.client.post("/special/lead-generation-requests/", {
            "countries": [self.country.id],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list_requests(self):
        LeadGenerationRequest.objects.create(user=self.user)
        resp = self.client.get("/special/lead-generation-requests/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)


class ScheduledLeadGenerationRequestViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.country = Country.objects.create(name="TestCountry", slug="test-country", code="TC")

    def _payload(self):
        return {
            "countries": [self.country.id],
            "company_leads_only": False,
            "modes": ["On-Site", "Hybrid", "Remote"],
            "company_sizes": ["Startup", "Scaleup", "Established", "Enterprise"],
            "num_leads": 12,
            "additional_comment": "Only motorsports teams",
        }

    def test_free_user_create_forbidden(self):
        resp = self.client.post("/special/scheduled-lead-generation/", self._payload(), format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            ScheduledLeadGenerationRequest.objects.filter(user=self.user).count(), 0
        )

    def test_premium_create_creates_schedule_and_initial_request(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        resp = self.client.post("/special/scheduled-lead-generation/", self._payload(), format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        schedule = ScheduledLeadGenerationRequest.objects.get(user=self.user)
        self.assertEqual(schedule.num_leads, 12)
        self.assertEqual(schedule.additional_comment, "Only motorsports teams")
        self.assertIsNotNone(schedule.last_generation_request)
        request = schedule.last_generation_request
        self.assertEqual(request.schedule, schedule)
        self.assertEqual(request.num_leads, 12)
        self.assertIn(self.country, request.countries.all())

    def test_premium_create_duplicate_fails(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        first = self.client.post("/special/scheduled-lead-generation/", self._payload(), format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = self.client.post("/special/scheduled-lead-generation/", self._payload(), format="json")
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_premium_update_criteria(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        created = self.client.post("/special/scheduled-lead-generation/", self._payload(), format="json")
        schedule_id = created.data["id"]
        before_count = LeadGenerationRequest.objects.filter(user=self.user).count()

        updated = self.client.put(
            f"/special/scheduled-lead-generation/{schedule_id}/",
            {
                "countries": [self.country.id],
                "modes": ["Remote"],
                "company_sizes": ["Startup"],
                "num_leads": 5,
                "additional_comment": "Remote NGO roles",
            },
            format="json",
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        schedule = ScheduledLeadGenerationRequest.objects.get(user=self.user)
        self.assertEqual(schedule.num_leads, 5)
        self.assertEqual(schedule.additional_comment, "Remote NGO roles")
        self.assertEqual(schedule.modes, ["Remote"])
        self.assertEqual(LeadGenerationRequest.objects.filter(user=self.user).count(), before_count)

    def test_free_user_update_forbidden(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        created = self.client.post("/special/scheduled-lead-generation/", self._payload(), format="json")
        self.user.profile.is_premium = False
        self.user.profile.save()
        resp = self.client.put(
            f"/special/scheduled-lead-generation/{created.data['id']}/",
            self._payload(),
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_premium_destroy(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        created = self.client.post("/special/scheduled-lead-generation/", self._payload(), format="json")
        resp = self.client.delete(
            f"/special/scheduled-lead-generation/{created.data['id']}/"
        )
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(
            ScheduledLeadGenerationRequest.objects.filter(user=self.user).count(), 0
        )

    def test_free_user_destroy_forbidden(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        created = self.client.post("/special/scheduled-lead-generation/", self._payload(), format="json")
        self.user.profile.is_premium = False
        self.user.profile.save()
        resp = self.client.delete(
            f"/special/scheduled-lead-generation/{created.data['id']}/"
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            ScheduledLeadGenerationRequest.objects.filter(user=self.user).count(), 1
        )

    def test_list_only_own_schedule(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        self.client.post("/special/scheduled-lead-generation/", self._payload(), format="json")
        other = User.objects.create_user(username="bob", password="pass")
        other.profile.is_premium = True
        other.profile.save()
        ScheduledLeadGenerationRequest.objects.create(user=other)
        resp = self.client.get("/special/scheduled-lead-generation/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)


class CoverLetterGenerationRequestViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.cv = CV.objects.create(user=self.user, key="My CV")
        self.lead = Lead.objects.create(company="Acme Corp", user=self.user)

    def test_create_cover_letter_request(self):
        resp = self.client.post("/special/cover-letter-requests/", {
            "cv": self.cv.id,
            "lead": self.lead.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_create_missing_cv(self):
        resp = self.client.post("/special/cover-letter-requests/", {
            "lead": self.lead.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_lead(self):
        resp = self.client.post("/special/cover-letter-requests/", {
            "cv": self.cv.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_cv_not_found(self):
        resp = self.client.post("/special/cover-letter-requests/", {
            "cv": 9999,
            "lead": self.lead.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_lead_not_found(self):
        resp = self.client.post("/special/cover-letter-requests/", {
            "cv": self.cv.id,
            "lead": 9999,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_duplicate_pending(self):
        CoverLetterGenerationRequest.objects.create(
            user=self.user, cv=self.cv, lead=self.lead, is_done=False,
        )
        resp = self.client.post("/special/cover-letter-requests/", {
            "cv": self.cv.id,
            "lead": self.lead.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_free_user_daily_limit(self):
        CoverLetterGenerationRequest.objects.create(
            user=self.user, cv=self.cv, lead=self.lead,
            created_at=timezone.now(),
        )
        resp = self.client.post("/special/cover-letter-requests/", {
            "cv": self.cv.id,
            "lead": self.lead.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_premium_user_no_limit(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        CoverLetterGenerationRequest.objects.create(
            user=self.user, cv=self.cv, lead=self.lead,
            created_at=timezone.now(), is_done=True,
        )
        resp = self.client.post("/special/cover-letter-requests/", {
            "cv": self.cv.id,
            "lead": self.lead.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list_requests(self):
        CoverLetterGenerationRequest.objects.create(user=self.user, cv=self.cv, lead=self.lead)
        resp = self.client.get("/special/cover-letter-requests/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
