from django.test import TestCase
from django.contrib.auth.models import User
from special.models import (
    Industry, ExperienceLevel, Role, Country, City,
    CVReview, LeadGenerationRequest, ScheduledLeadGenerationRequest,
    CoverLetterGenerationRequest,
)
from special.serializers import (
    IndustrySerializer, ExperienceLevelSerializer, RoleSerializer,
    CountrySerializer, CitySerializer, CVReviewSerializer,
    LeadGenerationRequestSerializer, ScheduledLeadGenerationRequestSerializer,
    CoverLetterGenerationRequestSerializer,
)
from jam.models import CV, Lead


class ReferenceDataSerializersTest(TestCase):
    def test_industry_serializer(self):
        ind = Industry.objects.create(name="TestIndustry", slug="test-industry")
        s = IndustrySerializer(ind)
        self.assertEqual(s.data["name"], "TestIndustry")
        self.assertEqual(s.data["slug"], "test-industry")

    def test_experience_level_serializer(self):
        el = ExperienceLevel.objects.create(name="TestLevel", slug="test-level")
        s = ExperienceLevelSerializer(el)
        self.assertEqual(s.data["name"], "TestLevel")

    def test_role_serializer(self):
        r = Role.objects.create(name="TestRole", slug="test-role")
        s = RoleSerializer(r)
        self.assertEqual(s.data["name"], "TestRole")

    def test_country_serializer(self):
        c = Country.objects.create(name="TestCountry", slug="test-country", code="TC")
        s = CountrySerializer(c)
        self.assertEqual(s.data["code"], "TC")

    def test_city_serializer(self):
        country = Country.objects.create(name="TestCountry", slug="test-country", code="TC")
        city = City.objects.create(name="TestCity", slug="test-city", country=country)
        s = CitySerializer(city)
        self.assertEqual(s.data["country_name"], "TestCountry")


class CVReviewSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.cv = CV.objects.create(user=self.user, key="My CV")
        self.industry = Industry.objects.create(name="TestIndustry", slug="test-industry")
        self.experience = ExperienceLevel.objects.create(name="TestLevel", slug="test-level")
        self.role = Role.objects.create(name="TestRole", slug="test-role")

    def test_serialize_cv_review(self):
        review = CVReview.objects.create(
            user=self.user, cv=self.cv,
            industry=self.industry, experience_level=self.experience,
        )
        review.roles.add(self.role)
        s = CVReviewSerializer(review)
        self.assertEqual(s.data["cv_key"], "My CV")
        self.assertEqual(s.data["industry_name"], "TestIndustry")
        self.assertEqual(s.data["experience_level_name"], "TestLevel")
        self.assertEqual(s.data["roles_names"], ["TestRole"])
        self.assertFalse(s.data["is_done"])

    def test_deserialize_cv_review(self):
        data = {
            "cv": self.cv.id,
            "industry": self.industry.id,
            "experience_level": self.experience.id,
            "roles": [self.role.id],
        }
        s = CVReviewSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_deserialize_cv_review_missing_fields(self):
        s = CVReviewSerializer(data={})
        self.assertFalse(s.is_valid())
        self.assertIn("cv", s.errors)
        self.assertIn("industry", s.errors)


class CoverLetterSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.cv = CV.objects.create(user=self.user, key="My CV")
        self.lead = Lead.objects.create(company="Acme Corp", role="Engineer", user=self.user)

    def test_serialize_cover_letter_request(self):
        req = CoverLetterGenerationRequest.objects.create(
            user=self.user, cv=self.cv, lead=self.lead,
        )
        s = CoverLetterGenerationRequestSerializer(req)
        self.assertEqual(s.data["cv_key"], "My CV")
        self.assertEqual(s.data["lead_company"], "Acme Corp")
        self.assertEqual(s.data["lead_role"], "Engineer")

    def test_deserialize_cover_letter_request(self):
        data = {"cv": self.cv.id, "lead": self.lead.id}
        s = CoverLetterGenerationRequestSerializer(data=data)
        self.assertTrue(s.is_valid())


class LeadGenerationRequestSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.country = Country.objects.create(name="TestCountry", slug="test-country", code="TC")
        self.role = Role.objects.create(name="TestRole", slug="test-role")

    def test_serialize(self):
        req = LeadGenerationRequest.objects.create(user=self.user)
        req.countries.add(self.country)
        req.roles.add(self.role)
        s = LeadGenerationRequestSerializer(req)
        self.assertEqual(s.data["countries_names"], ["TestCountry"])
        self.assertEqual(s.data["roles_names"], ["TestRole"])

    def test_deserialize(self):
        data = {"countries": [self.country.id]}
        s = LeadGenerationRequestSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_default_num_leads(self):
        data = {"countries": [self.country.id]}
        s = LeadGenerationRequestSerializer(data=data)
        self.assertTrue(s.is_valid())
        self.assertEqual(s.validated_data["num_leads"], 15)

    def test_num_leads_bounds(self):
        for value in [0, 16, -1]:
            data = {"countries": [self.country.id], "num_leads": value}
            s = LeadGenerationRequestSerializer(data=data)
            self.assertFalse(s.is_valid())
        data = {"countries": [self.country.id], "num_leads": 15}
        s = LeadGenerationRequestSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_comment_too_long(self):
        data = {"countries": [self.country.id], "additional_comment": "x" * 501}
        s = LeadGenerationRequestSerializer(data=data)
        self.assertFalse(s.is_valid())

    def test_comment_whitespace_normalized(self):
        data = {"countries": [self.country.id], "additional_comment": "  hello  "}
        s = LeadGenerationRequestSerializer(data=data)
        self.assertTrue(s.is_valid())
        self.assertEqual(s.validated_data["additional_comment"], "hello")

    def test_modes_whitelist(self):
        data = {"countries": [self.country.id], "modes": ["On-Site", "Nope"]}
        s = LeadGenerationRequestSerializer(data=data)
        self.assertFalse(s.is_valid())

    def test_company_sizes_whitelist(self):
        data = {"countries": [self.country.id], "company_sizes": ["Nope"]}
        s = LeadGenerationRequestSerializer(data=data)
        self.assertFalse(s.is_valid())

    def test_read_only_counts(self):
        req = LeadGenerationRequest.objects.create(
            user=self.user, leads_generated_count=3,
        )
        s = LeadGenerationRequestSerializer(req)
        self.assertEqual(s.data["leads_generated_count"], 3)


class ScheduledLeadGenerationRequestSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.country = Country.objects.create(name="TestCountry", slug="test-country", code="TC")

    def test_deserialize_valid(self):
        data = {
            "countries": [self.country.id],
            "modes": ["Remote"],
            "company_sizes": ["Startup"],
            "num_leads": 5,
            "additional_comment": "Motorsports only",
        }
        s = ScheduledLeadGenerationRequestSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_num_leads_bounds(self):
        data = {"countries": [self.country.id], "num_leads": 20}
        s = ScheduledLeadGenerationRequestSerializer(data=data)
        self.assertFalse(s.is_valid())

    def test_serialize(self):
        schedule = ScheduledLeadGenerationRequest.objects.create(
            user=self.user, num_leads=7, additional_comment="NGO roles",
        )
        schedule.countries.add(self.country)
        s = ScheduledLeadGenerationRequestSerializer(schedule)
        self.assertEqual(s.data["num_leads"], 7)
        self.assertEqual(s.data["additional_comment"], "NGO roles")
        self.assertEqual(s.data["countries_names"], ["TestCountry"])
        self.assertIsNone(s.data["last_generation_request"])
