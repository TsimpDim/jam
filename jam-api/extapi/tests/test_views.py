from datetime import date
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from knox.models import AuthToken
from jam.models import Group, Step, Lead, JobApplication


class ExtensionLoginViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="securepass123")
        self.client = APIClient()
        self.url = "/extapi/auth/login/"

    def test_login_success(self):
        resp = self.client.post(self.url, {"username": "alice", "password": "securepass123"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("token", resp.data)
        self.assertEqual(resp.data["user"]["username"], "alice")

    def test_login_invalid(self):
        resp = self.client.post(self.url, {"username": "alice", "password": "wrong"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_fields(self):
        resp = self.client.post(self.url, {"username": "alice"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class ExtensionLogoutViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        from knox.models import AuthToken
        _, self.token = AuthToken.objects.create(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token}')
        self.url = "/extapi/auth/logout/"

    def test_logout_success(self):
        resp = self.client.post(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_logout_unauthenticated(self):
        self.client.credentials()
        resp = self.client.post(self.url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class GroupListViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/extapi/groups/"

    def test_list_groups(self):
        # "Default Group" exists from signal + our custom one
        Group.objects.create(name="Custom Group", user=self.user, position=2)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)

    def test_user_isolation(self):
        other = User.objects.create_user(username="bob", password="pass")
        Group.objects.create(name="Other", user=other, position=1)
        resp = self.client.get(self.url)
        # Only "Default Group" from signal
        self.assertEqual(len(resp.data), 1)


class StepListViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/extapi/steps/"

    def test_list_steps(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # 7 default steps from signal
        self.assertEqual(len(resp.data), 7)

    def test_user_isolation(self):
        other = User.objects.create_user(username="bob", password="pass")
        # Other user has their own 7 default steps
        resp = self.client.get(self.url)
        self.assertEqual(len(resp.data), 7)


class LeadListViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/extapi/leads/"

    def test_list_leads(self):
        Lead.objects.create(company="Acme Corp", user=self.user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_user_isolation(self):
        other = User.objects.create_user(username="bob", password="pass")
        Lead.objects.create(company="Other Corp", user=other)
        resp = self.client.get(self.url)
        self.assertEqual(len(resp.data), 0)


class AddLeadViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/extapi/leads/add/"

    def test_add_lead(self):
        resp = self.client.post(self.url, {
            "company": "New Corp",
            "role": "Engineer",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["company"], "New Corp")
        self.assertTrue(Lead.objects.filter(company="New Corp", user=self.user).exists())

    def test_add_lead_missing_company(self):
        resp = self.client.post(self.url, {"role": "Engineer"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_lead_sets_date_today(self):
        resp = self.client.post(self.url, {"company": "Corp"}, format="json")
        l = Lead.objects.get(company="Corp", user=self.user)
        self.assertEqual(l.date, date.today())

    def test_add_lead_unauthenticated(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post(self.url, {"company": "Corp"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class AddApplicationViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.group = Group.objects.get(user=self.user, name="Default Group")
        self.step = Step.objects.get(user=self.user, type="S")
        self.url = "/extapi/applications/add/"

    def test_add_application(self):
        resp = self.client.post(self.url, {
            "company": "Acme Corp",
            "role": "Engineer",
            "group": self.group.id,
            "initial_step": self.step.id,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(JobApplication.objects.filter(company="Acme Corp", user=self.user).exists())

    def test_add_application_sets_date_today(self):
        resp = self.client.post(self.url, {
            "company": "Acme Corp",
            "role": "Engineer",
            "group": self.group.id,
        }, format="json")
        ja = JobApplication.objects.get(company="Acme Corp", user=self.user)
        self.assertEqual(ja.date, date.today())

    def test_add_application_missing_required_fields(self):
        resp = self.client.post(self.url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_application_unauthenticated(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post(self.url, {
            "company": "Corp", "role": "Eng", "group": 1,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
