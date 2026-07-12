from datetime import date
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError as DRFValidationError
from jam.models import Group, Step, Lead, JobApplication, Timeline, CV, NotificationType, Notification
from jam.serializers import (
    GroupSerializer, StepSerializer, LeadSerializer,
    JobApplicationSerializer, TimelineSerializer, CVSerializer,
    NotificationSerializer,
)


class GroupSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")

    def test_serialize_group(self):
        g = Group.objects.create(name="Tech", user=self.user, position=1)
        s = GroupSerializer(g)
        self.assertEqual(s.data["name"], "Tech")
        self.assertEqual(s.data["position"], 1)

    def test_deserialize_group(self):
        data = {"name": "New Group", "user": self.user.id}
        s = GroupSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_deserialize_group_missing_name(self):
        data = {"user": self.user.id}
        s = GroupSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn("name", s.errors)


class StepSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")

    def test_serialize_step(self):
        s = Step.objects.create(name="Applied", type="S", user=self.user, color="#0072a3")
        serializer = StepSerializer(s)
        self.assertEqual(serializer.data["name"], "Applied")
        self.assertEqual(serializer.data["type"], "S")
        self.assertEqual(serializer.data["color"], "#0072a3")

    def test_deserialize_step(self):
        data = {"name": "Interview", "type": "D", "user": self.user.id}
        s = StepSerializer(data=data)
        self.assertTrue(s.is_valid())

    def test_deserialize_step_invalid_type(self):
        data = {"name": "Bad", "type": "X", "user": self.user.id}
        s = StepSerializer(data=data)
        self.assertFalse(s.is_valid())


class LeadSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.group = Group.objects.create(name="Tech", user=self.user)

    def test_serialize_lead_no_group(self):
        l = Lead.objects.create(company="Acme Corp", user=self.user)
        s = LeadSerializer(l)
        self.assertEqual(s.data["company"], "Acme Corp")
        self.assertIsNone(s.data["group_name"])

    def test_serialize_lead_with_group(self):
        l = Lead.objects.create(company="Acme Corp", user=self.user, group=self.group)
        s = LeadSerializer(l)
        self.assertEqual(s.data["group_name"], "Tech")

    def test_serialize_lead_with_applications(self):
        l = Lead.objects.create(company="Acme Corp", user=self.user)
        step = Step.objects.create(name="Applied", type="S", user=self.user)
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, initial_step=step, lead=l,
        )
        s = LeadSerializer(l)
        self.assertEqual(len(s.data["applications"]), 1)
        self.assertEqual(s.data["applications"][0]["role"], "Engineer")


class JobApplicationSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.group = Group.objects.create(name="Tech", user=self.user)
        self.step = Step.objects.create(name="Applied", type="S", user=self.user)

    def test_serialize_job_application(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        s = JobApplicationSerializer(ja)
        self.assertEqual(s.data["company"], "Acme Corp")
        self.assertEqual(s.data["group_name"], "Tech")
        self.assertEqual(s.data["status"], "IN PROGRESS")
        self.assertIsNone(s.data["last_step_color"])

    def test_status_completed(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, initial_step=self.step,
        )
        end_step = Step.objects.create(name="Offer", type="E", user=self.user)
        Timeline.objects.create(
            group=self.group, user=self.user, step=end_step,
            application=ja, date=date.today(),
        )
        s = JobApplicationSerializer(ja)
        self.assertEqual(s.data["status"], "COMPLETED")

    def test_last_step_color(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        from jam.models import Timeline
        tl = Timeline.objects.create(
            group=self.group, user=self.user, step=self.step,
            application=ja, date=date.today(),
        )
        s = JobApplicationSerializer(ja)
        self.assertEqual(s.data["last_step_color"], Step.DEFAULT_COLOR)


class TimelineSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.group = Group.objects.create(name="Tech", user=self.user)
        self.step = Step.objects.create(name="Applied", type="S", user=self.user)
        self.ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, initial_step=self.step,
        )

    def test_serialize_timeline_with_nested_step(self):
        tl = Timeline.objects.create(
            group=self.group, user=self.user, step=self.step,
            application=self.ja, date=date.today(),
        )
        s = TimelineSerializer(tl)
        self.assertEqual(s.data["step"]["name"], "Applied")
        self.assertEqual(s.data["step"]["type"], "S")


class CVSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")

    def test_serialize_cv(self):
        cv = CV.objects.create(user=self.user, key="My CV")
        s = CVSerializer(cv)
        self.assertEqual(s.data["key"], "My CV")
        self.assertIn("id", s.data)
        self.assertIn("created_at", s.data)
        self.assertIn("updated_at", s.data)

    def test_deserialize_cv(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        data = {
            "key": "My CV",
            "user": self.user.id,
            "file": SimpleUploadedFile("test.pdf", b"%PDF-1.4", content_type="application/pdf"),
        }
        s = CVSerializer(data=data)
        self.assertTrue(s.is_valid())


class NotificationSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.nt = NotificationType.objects.create(
            code="test", text_template="Test {x}", status="success",
        )

    def test_serialize_notification(self):
        n = Notification.objects.create(
            user=self.user, notification_type=self.nt, text="Test msg",
        )
        s = NotificationSerializer(n)
        self.assertEqual(s.data["notification_type"], "test")
        self.assertEqual(s.data["status"], "success")
        self.assertEqual(s.data["text"], "Test msg")
        self.assertFalse(s.data["is_read"])
