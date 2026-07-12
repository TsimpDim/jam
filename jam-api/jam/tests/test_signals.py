from datetime import date, timedelta
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth.models import User
from jam.models import (
    UserProfile, Step, Group, Timeline, JobApplication,
    JobAdSnapshot, Lead, LeadSnapshot,
)
import threading


class ThreadMock(threading.Thread):
    """Mock thread that runs synchronously for testing."""
    def start(self):
        if self._target:
            self._target(*self._args, **self._kwargs)


class UserSignalsTest(TestCase):
    def test_user_creation_creates_profile(self):
        user = User.objects.create_user(username="alice", password="pass")
        self.assertTrue(UserProfile.objects.filter(user=user).exists())

    def test_user_creation_creates_default_steps(self):
        user = User.objects.create_user(username="alice", password="pass")
        steps = Step.objects.filter(user=user)
        self.assertGreaterEqual(steps.count(), 7)
        step_names = [s.name for s in steps]
        self.assertIn("Applied", step_names)
        self.assertIn("HR Interview", step_names)
        self.assertIn("Technical Interview", step_names)
        self.assertIn("Interview", step_names)
        self.assertIn("Response", step_names)
        self.assertIn("Offer", step_names)
        self.assertIn("Rejected", step_names)

    def test_user_creation_creates_default_group(self):
        user = User.objects.create_user(username="alice", password="pass")
        self.assertTrue(Group.objects.filter(user=user, name="Default Group").exists())

    def test_user_creation_step_types(self):
        user = User.objects.create_user(username="alice", password="pass")
        start_step = Step.objects.get(user=user, type="S")
        self.assertEqual(start_step.name, "Applied")
        end_steps = Step.objects.filter(user=user, type="E")
        self.assertEqual(end_steps.count(), 2)
        self.assertIn("Offer", [s.name for s in end_steps])
        self.assertIn("Rejected", [s.name for s in end_steps])

    def test_multiple_users_get_independent_defaults(self):
        u1 = User.objects.create_user(username="alice", password="pass")
        u2 = User.objects.create_user(username="bob", password="pass")
        self.assertEqual(Group.objects.filter(user=u1).count(), 1)
        self.assertEqual(Group.objects.filter(user=u2).count(), 1)

    def test_user_creation_colors(self):
        user = User.objects.create_user(username="alice", password="pass")
        applied = Step.objects.get(user=user, name="Applied")
        self.assertEqual(applied.color, "#0072a3")
        offer = Step.objects.get(user=user, name="Offer")
        self.assertEqual(offer.color, "#038103")
        rejected = Step.objects.get(user=user, name="Rejected")
        self.assertEqual(rejected.color, "#ff5233")


class JobApplicationSignalsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.group = Group.objects.get(user=self.user, name="Default Group")
        self.step = Step.objects.get(user=self.user, type="S")

    def test_create_jobapp_creates_timeline_with_initial_step(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, initial_step=self.step,
            date=date.today(),
        )
        self.assertTrue(Timeline.objects.filter(application=ja).exists())
        tl = Timeline.objects.get(application=ja)
        self.assertEqual(tl.step, self.step)
        self.assertEqual(tl.date, date.today())

    def test_create_jobapp_no_initial_step_no_timeline(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        self.assertFalse(Timeline.objects.filter(application=ja).exists())

    @patch("threading.Thread", ThreadMock)
    @patch("jam.utils.fetch_job_ad_snapshot", return_value="Fetched job ad content")
    def test_create_jobapp_with_external_link_creates_snapshot(self, mock_fetch):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, initial_step=self.step,
            external_link="https://example.com/job",
        )
        self.assertTrue(JobAdSnapshot.objects.filter(job_application=ja).exists())

    @patch("threading.Thread", ThreadMock)
    @patch("jam.utils.fetch_job_ad_snapshot", return_value="Fetched job ad content")
    def test_create_jobapp_without_external_link_no_snapshot(self, mock_fetch):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, initial_step=self.step,
        )
        self.assertFalse(JobAdSnapshot.objects.filter(job_application=ja).exists())

    @patch("threading.Thread", ThreadMock)
    @patch("jam.utils.fetch_job_ad_snapshot", return_value="Fetched job ad content")
    def test_create_jobapp_snapshot_update_on_save(self, mock_fetch):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, initial_step=self.step,
            external_link="https://example.com/job",
        )
        self.assertTrue(JobAdSnapshot.objects.filter(job_application=ja).exists())
        self.assertEqual(JobAdSnapshot.objects.get(job_application=ja).text, "Fetched job ad content")


class LeadSignalsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.group = Group.objects.get(user=self.user, name="Default Group")

    @patch("threading.Thread", ThreadMock)
    @patch("jam.utils.fetch_job_ad_snapshot", return_value="Fetched lead content")
    def test_create_lead_with_external_link_creates_snapshot(self, mock_fetch):
        l = Lead.objects.create(
            company="Acme Corp", user=self.user,
            external_link="https://example.com/lead",
        )
        self.assertTrue(LeadSnapshot.objects.filter(lead=l).exists())

    @patch("threading.Thread", ThreadMock)
    @patch("jam.utils.fetch_job_ad_snapshot", return_value="Fetched lead content")
    def test_create_lead_without_external_link_no_snapshot(self, mock_fetch):
        l = Lead.objects.create(company="Acme Corp", user=self.user)
        self.assertFalse(LeadSnapshot.objects.filter(lead=l).exists())
