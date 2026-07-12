import json
from io import BytesIO
from datetime import date, timedelta
from unittest.mock import patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.core.management import call_command
from io import StringIO
from special.models import (
    CVReview, LeadGenerationRequest, CoverLetterGenerationRequest,
    Industry, ExperienceLevel, Role, Country, City,
)
from special.management.commands.generate_leads import Command as GenerateLeadsCommand
from jam.models import CV, Lead, NotificationType, Notification, Group


class AnswerCVReviewsCommandTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.industry = Industry.objects.create(name="Tech", slug="tech")
        self.experience = ExperienceLevel.objects.create(name="TestSenior", slug="test-senior")
        self.role = Role.objects.create(name="Engineer", slug="engineer")
        NotificationType.objects.create(
            code="cv_review_done",
            text_template="CV review for {industry} is complete!",
            status="success",
        )
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.cv_file = SimpleUploadedFile(
            "test_cv.pdf", b"%PDF-1.4 fake cv", content_type="application/pdf"
        )

    def _make_cv_review(self):
        cv = CV.objects.create(user=self.user, key="My CV", file=self.cv_file)
        review = CVReview.objects.create(
            user=self.user, cv=cv,
            industry=self.industry, experience_level=self.experience,
        )
        review.roles.add(self.role)
        return review

    @patch("special.management.commands.answer_cv_reviews.AwsClient.converse")
    def test_no_pending_reviews(self, mock_converse):
        out = StringIO()
        call_command("answer_cv_reviews", stdout=out)
        self.assertIn("No pending CV reviews to process", out.getvalue())
        mock_converse.assert_not_called()

    @patch("special.management.commands.answer_cv_reviews.AwsClient.converse")
    def test_process_pending_review_success(self, mock_converse):
        from django.core.files.uploadedfile import SimpleUploadedFile
        cv = CV.objects.create(user=self.user, key="My CV", file=self.cv_file)
        mock_converse.return_value = "Comprehensive review result text"

        review = CVReview.objects.create(
            user=self.user, cv=cv,
            industry=self.industry, experience_level=self.experience,
        )
        review.roles.add(self.role)

        out = StringIO()
        call_command("answer_cv_reviews", stdout=out)

        review.refresh_from_db()
        self.assertTrue(review.is_done)
        self.assertIsNotNone(review.completed_at)
        self.assertEqual(review.review_result, "Comprehensive review result text")
        self.assertIn("Successfully processed", out.getvalue())

    @patch("special.management.commands.answer_cv_reviews.AwsClient.converse")
    def test_process_creates_notification(self, mock_converse):
        from django.core.files.uploadedfile import SimpleUploadedFile
        cv = CV.objects.create(user=self.user, key="My CV", file=self.cv_file)
        mock_converse.return_value = "Review result"

        review = CVReview.objects.create(
            user=self.user, cv=cv,
            industry=self.industry, experience_level=self.experience,
        )
        review.roles.add(self.role)

        out = StringIO()
        call_command("answer_cv_reviews", stdout=out)

        self.assertTrue(Notification.objects.filter(user=self.user).exists())
        n = Notification.objects.get(user=self.user)
        self.assertIn("Tech", n.text)

    @patch("special.management.commands.answer_cv_reviews.AwsClient.converse")
    def test_error_handling(self, mock_converse):
        from django.core.files.uploadedfile import SimpleUploadedFile
        cv = CV.objects.create(user=self.user, key="My CV", file=self.cv_file)
        mock_converse.side_effect = Exception("AWS error")

        review = CVReview.objects.create(
            user=self.user, cv=cv,
            industry=self.industry, experience_level=self.experience,
        )
        review.roles.add(self.role)

        out = StringIO()
        call_command("answer_cv_reviews", stdout=out)

        review.refresh_from_db()
        self.assertFalse(review.is_done)
        self.assertIn("Error processing", out.getvalue())


class GenerateCoverLettersCommandTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        NotificationType.objects.create(
            code="cover_letter_done",
            text_template="Cover letter for {company} is ready!",
            status="success",
        )
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.cv_file = SimpleUploadedFile(
            "test_cv.pdf", b"%PDF-1.4 fake cv content", content_type="application/pdf"
        )

    @patch("special.management.commands.generate_cover_letters.AwsClient.converse")
    def test_no_pending_requests(self, mock_converse):
        out = StringIO()
        call_command("generate_cover_letters", stdout=out)
        self.assertIn("No pending cover letter requests", out.getvalue())
        mock_converse.assert_not_called()

    @patch("special.management.commands.generate_cover_letters.AwsClient.converse")
    def test_process_pending_request_success(self, mock_converse):
        cv = CV.objects.create(user=self.user, key="My CV", file=self.cv_file)
        lead = Lead.objects.create(company="Acme Corp", user=self.user)
        mock_converse.return_value = "Professional cover letter content"

        req = CoverLetterGenerationRequest.objects.create(
            user=self.user, cv=cv, lead=lead,
        )

        out = StringIO()
        call_command("generate_cover_letters", stdout=out)

        req.refresh_from_db()
        self.assertTrue(req.is_done)
        self.assertIsNotNone(req.completed_at)
        self.assertEqual(req.result, "Professional cover letter content")
        self.assertIn("Successfully generated", out.getvalue())

    @patch("special.management.commands.generate_cover_letters.AwsClient.converse")
    def test_process_creates_notification(self, mock_converse):
        cv = CV.objects.create(user=self.user, key="My CV", file=self.cv_file)
        lead = Lead.objects.create(company="Acme Corp", user=self.user)
        mock_converse.return_value = "Letter content"

        req = CoverLetterGenerationRequest.objects.create(
            user=self.user, cv=cv, lead=lead,
        )

        out = StringIO()
        call_command("generate_cover_letters", stdout=out)

        self.assertTrue(Notification.objects.filter(user=self.user).exists())
        n = Notification.objects.get(user=self.user)
        self.assertIn("Acme Corp", n.text)

    @patch("special.management.commands.generate_cover_letters.AwsClient.converse")
    def test_error_handling(self, mock_converse):
        cv = CV.objects.create(user=self.user, key="My CV", file=self.cv_file)
        lead = Lead.objects.create(company="Acme Corp", user=self.user)
        mock_converse.side_effect = Exception("AWS error")

        req = CoverLetterGenerationRequest.objects.create(
            user=self.user, cv=cv, lead=lead,
        )

        out = StringIO()
        call_command("generate_cover_letters", stdout=out)

        req.refresh_from_db()
        self.assertFalse(req.is_done)
        self.assertIn("Error generating", out.getvalue())


class GenerateLeadsCommandTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        NotificationType.objects.create(
            code="lead_generation_done",
            text_template="Found {count} new leads for {role_str}in {country_str}!",
            status="success",
        )
        NotificationType.objects.create(
            code="lead_generation_empty",
            text_template="No leads found for {role_str}in {country_str}.",
            status="warning",
        )

    def test_clip(self):
        self.assertEqual(GenerateLeadsCommand._clip("hello world", 5), "hello")
        self.assertEqual(GenerateLeadsCommand._clip("short", 10), "short")
        self.assertIsNone(GenerateLeadsCommand._clip(None, 10))
        self.assertEqual(GenerateLeadsCommand._clip("  spaced  ", 10), "spaced")

    def test_extract_json_basic(self):
        text = '[{"company": "Acme", "role": "Engineer"}]'
        result = GenerateLeadsCommand._extract_json(text)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["company"], "Acme")

    def test_extract_json_with_markdown_fence(self):
        text = '```json\n[{"company": "Acme"}]\n```'
        result = GenerateLeadsCommand._extract_json(text)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["company"], "Acme")

    def test_extract_json_with_thinking_tag(self):
        text = '<thinking>Selecting leads...</thinking>[{"company": "Acme"}]'
        result = GenerateLeadsCommand._extract_json(text)
        self.assertEqual(len(result), 1)

    def test_extract_json_no_array(self):
        with self.assertRaises(json.JSONDecodeError):
            GenerateLeadsCommand._extract_json("no array here")

    def test_extract_json_invalid(self):
        with self.assertRaises(json.JSONDecodeError):
            GenerateLeadsCommand._extract_json("[invalid")

    @patch("special.management.commands.generate_leads.WebSearch.search_jobs")
    @patch("special.management.commands.generate_leads.AwsClient.converse")
    def test_no_pending_requests(self, mock_converse, mock_search):
        out = StringIO()
        call_command("generate_leads", stdout=out)
        self.assertIn("No pending lead generation requests", out.getvalue())
        mock_converse.assert_not_called()
        mock_search.assert_not_called()

    @patch("special.management.commands.generate_leads.WebSearch.search_jobs")
    @patch("special.management.commands.generate_leads.AwsClient.converse")
    def test_process_with_results(self, mock_converse, mock_search):
        mock_search.return_value = [
            {"title": "Engineer at Acme Corp", "url": "https://example.com/job1", "snippet": "Engineer job"},
            {"title": "Developer at Beta Inc", "url": "https://example.com/job2", "snippet": "Developer job"},
        ]
        mock_converse.return_value = json.dumps([
            {"company": "Acme Corp", "role": "Engineer", "location": "NYC",
             "external_link": "https://example.com/job1", "notes": "Good match"},
            {"company": "Beta Inc", "role": "Developer", "location": "SF",
             "external_link": "https://example.com/job2", "notes": "Great match"},
        ])

        country = Country.objects.create(name="TestCountry", slug="test-country", code="TC")
        req = LeadGenerationRequest.objects.create(user=self.user)
        req.countries.add(country)

        out = StringIO()
        call_command("generate_leads", stdout=out)

        req.refresh_from_db()
        self.assertTrue(req.is_done)
        self.assertIsNotNone(req.completed_at)

        leads = Lead.objects.filter(user=self.user, generated=True)
        self.assertEqual(leads.count(), 2)
        self.assertIn("Saved 2 leads", out.getvalue())

    @patch("special.management.commands.generate_leads.WebSearch.search_jobs")
    @patch("special.management.commands.generate_leads.AwsClient.converse")
    def test_hallucinated_url_dropped(self, mock_converse, mock_search):
        mock_search.return_value = [
            {"title": "Engineer at Acme Corp", "url": "https://example.com/real", "snippet": "Real job"},
        ]
        mock_converse.return_value = json.dumps([
            {"company": "Acme Corp", "role": "Engineer", "location": "NYC",
             "external_link": "https://example.com/fake", "notes": "Good"},
        ])

        req = LeadGenerationRequest.objects.create(user=self.user)

        out = StringIO()
        call_command("generate_leads", stdout=out)

        lead = Lead.objects.get(user=self.user, generated=True)
        self.assertIsNone(lead.external_link)
        self.assertIn("hallucinated", out.getvalue())

    @patch("special.management.commands.generate_leads.WebSearch.search_jobs")
    @patch("special.management.commands.generate_leads.AwsClient.converse")
    def test_existing_lead_skipped(self, mock_converse, mock_search):
        mock_search.return_value = [
            {"title": "Engineer at Acme Corp", "url": "https://example.com/job1", "snippet": "Engineer"},
            {"title": "Dev at Beta Corp", "url": "https://example.com/job2", "snippet": "Dev"},
        ]
        mock_converse.return_value = json.dumps([
            {"company": "Acme Corp", "role": "Engineer", "location": "NYC",
             "external_link": "https://example.com/job1", "notes": "Good"},
            {"company": "Beta Corp", "role": "Dev", "location": "SF",
             "external_link": "https://example.com/job2", "notes": "Great"},
        ])

        Lead.objects.create(user=self.user, company="Acme Corp")

        req = LeadGenerationRequest.objects.create(user=self.user)

        out = StringIO()
        call_command("generate_leads", stdout=out)

        leads = Lead.objects.filter(user=self.user, generated=True)
        self.assertEqual(leads.count(), 1)
        self.assertEqual(leads.first().company, "Beta Corp")

    @patch("special.management.commands.generate_leads.WebSearch.search_jobs")
    def test_search_failure(self, mock_search):
        mock_search.side_effect = Exception("Search API error")

        req = LeadGenerationRequest.objects.create(user=self.user)

        out = StringIO()
        call_command("generate_leads", stdout=out)

        req.refresh_from_db()
        self.assertTrue(req.is_done)
        self.assertIn("Web search failed", out.getvalue())

    @patch("special.management.commands.generate_leads.WebSearch.search_jobs")
    def test_empty_search_results(self, mock_search):
        mock_search.return_value = []

        req = LeadGenerationRequest.objects.create(user=self.user)

        out = StringIO()
        call_command("generate_leads", stdout=out)

        req.refresh_from_db()
        self.assertTrue(req.is_done)
        self.assertIn("No search results found", out.getvalue())

    def test_clip_truncates_correctly(self):
        self.assertEqual(GenerateLeadsCommand._clip("abcdefghij", 5), "abcde")
        self.assertEqual(GenerateLeadsCommand._clip("abc", 5), "abc")
        self.assertIsNone(GenerateLeadsCommand._clip(None, 10))
        self.assertEqual(GenerateLeadsCommand._clip("  hello  ", 3), "hel")
