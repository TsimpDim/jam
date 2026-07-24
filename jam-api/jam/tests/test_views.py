import io
import json
from datetime import date, timedelta
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from jam.models import (
    Group, Step, Lead, JobApplication, JobAppFile, JobAdSnapshot, LeadSnapshot,
    CV, Timeline, NotificationType, Notification,
)
from jam.views import (
    GroupsViewSet, StepViewSet, JobApplicationViewSet,
    TimelineViewSet, LeadViewSet, CVViewSet, NotificationViewSet,
    AnalyticsView, SankeyView,
)


class GroupsViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/jam/groups/"

    def test_list_groups(self):
        Group.objects.create(name="Tech", user=self.user, position=2)
        Group.objects.create(name="Health", user=self.user, position=3)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Includes "Default Group" from signal
        self.assertEqual(len(resp.data), 3)

    def test_list_groups_other_user_isolation(self):
        other = User.objects.create_user(username="bob", password="pass")
        Group.objects.create(name="Other", user=other, position=1)
        resp = self.client.get(self.url)
        # Only the "Default Group" from signal
        self.assertEqual(len(resp.data), 1)

    def test_create_group(self):
        resp = self.client.post(self.url, {"name": "New Group"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["name"], "New Group")
        self.assertEqual(resp.data["position"], 1)

    def test_create_group_auto_increment_position(self):
        Group.objects.create(name="First", user=self.user, position=1)
        resp = self.client.post(self.url, {"name": "Second"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["position"], 2)

    def test_update_group(self):
        g = Group.objects.create(name="Old", user=self.user)
        resp = self.client.patch(f"{self.url}{g.id}/", {"name": "Updated"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Updated")

    def test_delete_group(self):
        g = Group.objects.create(name="Delete Me", user=self.user)
        resp = self.client.delete(f"{self.url}{g.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Group.objects.filter(id=g.id).exists())

    def test_reorder(self):
        g1 = Group.objects.create(name="First", user=self.user, position=1)
        g2 = Group.objects.create(name="Second", user=self.user, position=2)
        resp = self.client.patch(
            f"{self.url}reorder/",
            {"groups": [{"id": g1.id, "position": 2}, {"id": g2.id, "position": 1}]},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        g1.refresh_from_db()
        g2.refresh_from_db()
        self.assertEqual(g1.position, 2)
        self.assertEqual(g2.position, 1)

    def test_unauthenticated_access(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class StepViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/jam/steps/"

    def test_list_steps(self):
        Step.objects.create(name="Custom Step", type="D", user=self.user)
        Step.objects.create(name="Another Step", type="D", user=self.user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # 7 default steps from signal + 2 custom = 9
        self.assertEqual(len(resp.data), 9)

    def test_create_step(self):
        resp = self.client.post(self.url, {"name": "New Step", "type": "D"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["color"], Step.DEFAULT_COLOR)

    def test_create_step_with_color(self):
        resp = self.client.post(
            self.url, {"name": "Colored Step", "type": "D", "color": "#ff0000"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["color"], "#ff0000")

    def test_initial_steps(self):
        Step.objects.create(name="Custom Start", type="S", user=self.user)
        # The default "Applied" step is also type "S"
        resp = self.client.get(f"{self.url}initial/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_update_step(self):
        s = Step.objects.create(name="Original", type="D", user=self.user)
        resp = self.client.patch(f"{self.url}{s.id}/", {"name": "Updated"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Updated")

    def test_delete_step(self):
        s = Step.objects.create(name="Delete Me", type="D", user=self.user)
        resp = self.client.delete(f"{self.url}{s.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)


class JobApplicationViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.group = Group.objects.create(name="Tech", user=self.user)
        self.step = Step.objects.create(name="Applied", type="S", user=self.user)
        self.url = "/jam/jobapps/"

    def test_list_job_applications(self):
        JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, initial_step=self.step,
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_create_job_application(self):
        resp = self.client.post(self.url, {
            "company": "Acme Corp", "role": "Engineer",
            "group": self.group.id, "initial_step": self.step.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["company"], "Acme Corp")
        self.assertEqual(resp.data["status"], "IN PROGRESS")

    def test_create_job_application_default_date(self):
        resp = self.client.post(self.url, {
            "company": "Acme Corp", "role": "Engineer",
            "group": self.group.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["date"], str(date.today()))

    def test_create_job_application_specific_date(self):
        resp = self.client.post(self.url, {
            "company": "Acme Corp", "role": "Engineer",
            "group": self.group.id, "date": "2024-01-15",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["date"], "2024-01-15")

    def test_group_endpoint(self):
        g2 = Group.objects.create(name="Health", user=self.user, position=2)
        JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        JobApplication.objects.create(
            company="Med Corp", role="Doctor",
            group=g2, user=self.user,
        )
        resp = self.client.get(f"{self.url}group/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("Tech", resp.data)
        self.assertIn("Health", resp.data)

    def test_ad_snapshot_found(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        JobAdSnapshot.objects.create(job_application=ja, text="Ad text")
        resp = self.client.get(f"{self.url}{ja.id}/ad-snapshot/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["text"], "Ad text")

    def test_ad_snapshot_not_found(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        resp = self.client.get(f"{self.url}{ja.id}/ad-snapshot/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_job_application(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        resp = self.client.delete(f"{self.url}{ja.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_update_job_application(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        resp = self.client.patch(f"{self.url}{ja.id}/", {"role": "Senior Engineer"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["role"], "Senior Engineer")


class LeadViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.group = Group.objects.create(name="Tech", user=self.user)
        self.url = "/jam/leads/"

    def test_list_leads(self):
        Lead.objects.create(company="Acme Corp", user=self.user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_filter_archived_true(self):
        Lead.objects.create(company="Active", user=self.user, archived=False)
        Lead.objects.create(company="Archived", user=self.user, archived=True)
        resp = self.client.get(f"{self.url}?archived=true")
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["company"], "Archived")

    def test_filter_archived_false(self):
        Lead.objects.create(company="Active", user=self.user, archived=False)
        Lead.objects.create(company="Archived", user=self.user, archived=True)
        resp = self.client.get(f"{self.url}?archived=false")
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["company"], "Active")

    def test_filter_archived_all(self):
        Lead.objects.create(company="Active", user=self.user, archived=False)
        Lead.objects.create(company="Archived", user=self.user, archived=True)
        resp = self.client.get(f"{self.url}?archived=all")
        self.assertEqual(len(resp.data), 2)

    def test_create_lead(self):
        resp = self.client.post(self.url, {
            "company": "New Corp", "role": "Developer",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["company"], "New Corp")
        self.assertEqual(resp.data["date"], str(date.today()))

    def test_create_lead_with_specific_date(self):
        # Lead.date has auto_now_add=True, so it's always set to creation date
        resp = self.client.post(self.url, {
            "company": "New Corp", "date": "2024-06-01",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["date"], str(date.today()))

    def test_partial_update_lead(self):
        l = Lead.objects.create(company="Old Corp", user=self.user)
        resp = self.client.patch(f"{self.url}{l.id}/", {"company": "Updated Corp"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["company"], "Updated Corp")

    def test_delete_lead_disassociates_applications(self):
        l = Lead.objects.create(company="Acme Corp", user=self.user)
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, lead=l,
        )
        resp = self.client.delete(f"{self.url}{l.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        ja.refresh_from_db()
        self.assertIsNone(ja.lead)

    def test_snapshot_found(self):
        l = Lead.objects.create(company="Acme Corp", user=self.user)
        LeadSnapshot.objects.create(lead=l, text="Snapshot data")
        resp = self.client.get(f"{self.url}{l.id}/snapshot/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["text"], "Snapshot data")

    def test_snapshot_not_found(self):
        l = Lead.objects.create(company="Acme Corp", user=self.user)
        resp = self.client.get(f"{self.url}{l.id}/snapshot/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_isolation(self):
        other = User.objects.create_user(username="bob", password="pass")
        Lead.objects.create(company="Other Corp", user=other)
        l = Lead.objects.create(company="My Corp", user=self.user)
        resp = self.client.get(f"{self.url}{l.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        resp = self.client.get(f"{self.url}999999/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class CVViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/jam/cvs/"

    def test_list_cvs(self):
        CV.objects.create(user=self.user, key="My CV")
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_create_cv(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("test.pdf", b"%PDF-1.4 test content", content_type="application/pdf")
        resp = self.client.post(self.url, {"key": "My CV", "file": f}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["key"], "My CV")

    def test_create_cv_exceeds_free_limit(self):
        CV.objects.create(user=self.user, key="Only CV")
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("second.pdf", b"%PDF-1.4", content_type="application/pdf")
        resp = self.client.post(self.url, {"key": "Second CV", "file": f}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("limit", resp.data["error"].lower())

    def test_premium_user_can_upload_multiple(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        CV.objects.create(user=self.user, key="First")
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("second.pdf", b"%PDF-1.4", content_type="application/pdf")
        resp = self.client.post(self.url, {"key": "Second CV", "file": f}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_update_cv_key(self):
        cv = CV.objects.create(user=self.user, key="Old Key")
        resp = self.client.patch(f"{self.url}{cv.id}/", {"key": "New Key"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["key"], "New Key")

    def test_delete_cv(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("test.pdf", b"%PDF-1.4", content_type="application/pdf")
        cv = CV.objects.create(user=self.user, key="Delete Me")
        resp = self.client.delete(f"{self.url}{cv.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_download_cv_not_found(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile("test.pdf", b"%PDF-1.4", content_type="application/pdf")
        cv = CV.objects.create(user=self.user, key="No file")
        cv.file = None
        cv.save()
        resp = self.client.get(f"{self.url}{cv.id}/download/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class JobAppFileViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.group = Group.objects.create(name="Tech", user=self.user)
        self.step = Step.objects.create(name="Applied", type="S", user=self.user)
        self.ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        self.url = "/jam/jobapp-files/"

    def test_create_file(self):
        f = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 test content", content_type="application/pdf")
        resp = self.client.post(self.url, {"job_application": self.ja.id, "file": f})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["name"], "resume.pdf")

    def test_list_files_by_jobapp(self):
        f1 = SimpleUploadedFile("a.pdf", b"%PDF-1.4", content_type="application/pdf")
        f2 = SimpleUploadedFile("b.pdf", b"%PDF-1.4", content_type="application/pdf")
        self.client.post(self.url, {"job_application": self.ja.id, "file": f1})
        self.client.post(self.url, {"job_application": self.ja.id, "file": f2})
        resp = self.client.get(f"/jam/jobapp-files/by-jobapp/{self.ja.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_create_file_exceeds_free_limit(self):
        for i in range(5):
            f = SimpleUploadedFile(f"file{i}.pdf", b"%PDF-1.4", content_type="application/pdf")
            self.client.post(self.url, {"job_application": self.ja.id, "file": f})
        f = SimpleUploadedFile("overflow.pdf", b"%PDF-1.4", content_type="application/pdf")
        resp = self.client.post(self.url, {"job_application": self.ja.id, "file": f})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("5 files", resp.data["error"])

    def test_premium_user_can_upload_up_to_10(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        for i in range(10):
            f = SimpleUploadedFile(f"file{i}.pdf", b"%PDF-1.4", content_type="application/pdf")
            resp = self.client.post(self.url, {"job_application": self.ja.id, "file": f})
            self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_premium_user_exceeds_10_limit(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        for i in range(10):
            f = SimpleUploadedFile(f"file{i}.pdf", b"%PDF-1.4", content_type="application/pdf")
            self.client.post(self.url, {"job_application": self.ja.id, "file": f})
        f = SimpleUploadedFile("overflow.pdf", b"%PDF-1.4", content_type="application/pdf")
        resp = self.client.post(self.url, {"job_application": self.ja.id, "file": f})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("10 files", resp.data["error"])

    def test_limit_is_per_job_application(self):
        ja2 = JobApplication.objects.create(
            company="Other Corp", role="Designer",
            group=self.group, user=self.user,
        )
        for i in range(5):
            f = SimpleUploadedFile(f"file{i}.pdf", b"%PDF-1.4", content_type="application/pdf")
            self.client.post(self.url, {"job_application": self.ja.id, "file": f})
        f = SimpleUploadedFile("for_other.pdf", b"%PDF-1.4", content_type="application/pdf")
        resp = self.client.post(self.url, {"job_application": ja2.id, "file": f})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_unsupported_file_type(self):
        f = SimpleUploadedFile("malware.exe", b"bad content", content_type="application/x-msdownload")
        resp = self.client.post(self.url, {"job_application": self.ja.id, "file": f})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Unsupported", resp.data["error"])


class TimelineViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.group = Group.objects.create(name="Tech", user=self.user)
        self.step = Step.objects.create(name="Applied", type="S", user=self.user)
        self.ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )
        self.url = "/jam/timeline/"

    def test_list_timeline(self):
        Timeline.objects.create(
            group=self.group, user=self.user, step=self.step,
            application=self.ja, date=date.today(),
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_get_per_jobapp(self):
        Timeline.objects.create(
            group=self.group, user=self.user, step=self.step,
            application=self.ja, date=date.today(),
        )
        resp = self.client.get(f"{self.url}jobapp/{self.ja.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_create_timeline_entry(self):
        resp = self.client.post(self.url, {
            "group": self.group.id,
            "step": self.step.id,
            "jobapp": self.ja.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_create_timeline_with_date(self):
        # First create first timeline entry without date (uses today)
        resp1 = self.client.post(self.url, {
            "group": self.group.id,
            "step": self.step.id,
            "jobapp": self.ja.id,
        }, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)
        # Now add another entry with a specific date
        step2 = Step.objects.create(name="Interview", type="D", user=self.user)
        resp2 = self.client.post(self.url, {
            "group": self.group.id,
            "step": step2.id,
            "jobapp": self.ja.id,
            "date": date.today().isoformat(),
        }, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)

    def test_create_non_default_step_out_of_order(self):
        end_step = Step.objects.create(name="Offer", type="E", user=self.user)
        Timeline.objects.create(
            group=self.group, user=self.user, step=self.step,
            application=self.ja, date=date.today(),
        )
        resp = self.client.post(self.url, {
            "group": self.group.id,
            "step": end_step.id,
            "jobapp": self.ja.id,
            "date": (date.today() - timedelta(days=5)).isoformat(),
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_timeline_with_question_mark_date(self):
        tl = Timeline.objects.create(
            group=self.group, user=self.user, step=self.step,
            application=self.ja, date=date.today(),
        )
        resp = self.client.patch(f"{self.url}{tl.id}/", {"date": "?"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_update_timeline_with_valid_date(self):
        tl = Timeline.objects.create(
            group=self.group, user=self.user, step=self.step,
            application=self.ja, date=date.today(),
        )
        resp = self.client.patch(
            f"{self.url}{tl.id}/",
            {"date": date.today().isoformat()},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class AnalyticsViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.group = Group.objects.create(name="Tech", user=self.user)
        self.step = Step.objects.create(name="Applied", type="S", user=self.user)
        self.url = "/jam/analytics/"

    def test_analytics_empty(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["totalJobApps"], 0)
        self.assertEqual(resp.data["totalLeads"], 0)
        self.assertEqual(resp.data["stepsPerApp"], "0.0")

    def test_analytics_with_data(self):
        ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user, initial_step=self.step,
            applied_through="LinkedIn",
        )
        end_step = Step.objects.create(name="Offer", type="E", user=self.user)
        Timeline.objects.create(
            group=self.group, user=self.user, step=self.step,
            application=ja, date=date.today() - timedelta(days=5),
        )
        Timeline.objects.create(
            group=self.group, user=self.user, step=end_step,
            application=ja, date=date.today(),
        )
        Lead.objects.create(company="Lead Corp", user=self.user, group=self.group)
        resp = self.client.get(self.url)
        self.assertEqual(resp.data["totalJobApps"], 1)
        self.assertEqual(resp.data["totalLeads"], 1)
        self.assertEqual(resp.data["completedJobApps"], 1)
        self.assertEqual(resp.data["pendingJobApps"], 0)

    def test_analytics_group_filter(self):
        g2 = Group.objects.create(name="Other", user=self.user, position=2)
        ja1 = JobApplication.objects.create(
            company="Corp A", role="Engineer",
            group=self.group, user=self.user,
        )
        ja2 = JobApplication.objects.create(
            company="Corp B", role="Doctor",
            group=g2, user=self.user,
        )
        resp = self.client.get(f"{self.url}?group={self.group.id}")
        self.assertEqual(resp.data["totalJobApps"], 1)

    def test_analytics_applied_through_breakdown(self):
        JobApplication.objects.create(
            company="Corp A", role="Engineer",
            group=self.group, user=self.user, applied_through="LinkedIn",
        )
        JobApplication.objects.create(
            company="Corp B", role="Dev",
            group=self.group, user=self.user, applied_through="Indeed",
        )
        resp = self.client.get(self.url)
        self.assertIn("LinkedIn", resp.data["appliedThrough"])
        self.assertIn("Indeed", resp.data["appliedThrough"])


class SankeyViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.group = Group.objects.create(name="Tech", user=self.user)
        self.step = Step.objects.get(user=self.user, type="S")
        self.end_step = Step.objects.get(user=self.user, type="E", name="Offer")
        self.url = "/jam/analytics/sankey/"
        self.ja = JobApplication.objects.create(
            company="Acme Corp", role="Engineer",
            group=self.group, user=self.user,
        )

    def test_sankey_with_timeline(self):
        Timeline.objects.create(
            group=self.group, user=self.user, step=self.step,
            application=self.ja, date=date.today(),
        )
        Timeline.objects.create(
            group=self.group, user=self.user, step=self.end_step,
            application=self.ja, date=date.today() + timedelta(days=5),
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("nodes", resp.data)
        self.assertIn("links", resp.data)
        # 7 default steps + "Drop-off" = 8 nodes
        self.assertEqual(len(resp.data["nodes"]), 8)

    def test_sankey_empty(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # 7 default steps + "Drop-off" = 8 nodes
        self.assertEqual(len(resp.data["nodes"]), 8)
        # Application with no timeline flows from first step to drop-off
        self.assertEqual(len(resp.data["links"]), 1)

    def test_sankey_group_filter(self):
        resp = self.client.get(f"{self.url}?group={self.group.id}")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class NotificationViewSetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.nt = NotificationType.objects.create(
            code="test", text_template="Test notification",
        )
        self.url = "/jam/notifications/"

    def test_list_notifications(self):
        Notification.objects.create(user=self.user, notification_type=self.nt, text="Msg 1")
        Notification.objects.create(user=self.user, notification_type=self.nt, text="Msg 2")
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_user_isolation(self):
        other = User.objects.create_user(username="bob", password="pass")
        Notification.objects.create(user=other, notification_type=self.nt, text="Other")
        resp = self.client.get(self.url)
        self.assertEqual(len(resp.data), 0)

    def test_mark_read(self):
        n = Notification.objects.create(user=self.user, notification_type=self.nt, text="Unread")
        self.assertFalse(n.is_read)
        resp = self.client.patch(f"{self.url}{n.id}/mark-read/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        n.refresh_from_db()
        self.assertTrue(n.is_read)

    def test_unread_count(self):
        Notification.objects.create(user=self.user, notification_type=self.nt, text="Unread 1")
        n2 = Notification.objects.create(user=self.user, notification_type=self.nt, text="Unread 2")
        n2.is_read = True
        n2.save()
        resp = self.client.get(f"{self.url}unread_count/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
