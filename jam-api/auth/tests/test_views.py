from django.test import TestCase
from django.contrib.auth.models import User
from django.core import mail
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch


class LoginViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="securepass123")
        self.client = APIClient()
        self.url = "/auth/login/"

    def test_login_success(self):
        resp = self.client.post(self.url, {"username": "alice", "password": "securepass123"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["user"]["username"], "alice")

    def test_login_invalid_password(self):
        resp = self.client.post(self.url, {"username": "alice", "password": "wrong"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_invalid_username(self):
        resp = self.client.post(self.url, {"username": "nonexistent", "password": "pass"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/auth/logout/"

    def test_logout_success(self):
        resp = self.client.post(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("logged out", resp.data["detail"].lower())

    def test_logout_unauthenticated(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post(self.url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class RegisterViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/auth/register/"

    def test_register_success(self):
        resp = self.client.post(self.url, {
            "username": "newuser",
            "email": "newuser@example.com",
            "password1": "securepass123",
            "password2": "securepass123",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["user"]["username"], "newuser")
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_register_password_mismatch(self):
        resp = self.client.post(self.url, {
            "username": "newuser",
            "email": "newuser@example.com",
            "password1": "securepass123",
            "password2": "differentpass",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password(self):
        resp = self.client.post(self.url, {
            "username": "newuser",
            "email": "newuser@example.com",
            "password1": "short",
            "password2": "short",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        User.objects.create_user(username="existing", password="pass12345")
        resp = self.client.post(self.url, {
            "username": "existing",
            "email": "existing@example.com",
            "password1": "securepass123",
            "password2": "securepass123",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        User.objects.create_user(username="user1", email="dup@example.com", password="pass12345")
        resp = self.client.post(self.url, {
            "username": "user2",
            "email": "dup@example.com",
            "password1": "securepass123",
            "password2": "securepass123",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class MeViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass12345")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/auth/me/"

    def test_me_returns_user_info(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "alice")
        self.assertFalse(resp.data["is_premium"])
        self.assertEqual(resp.data["cv_count"], 0)

    def test_me_unauthenticated(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class PasswordResetViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="alice", email="alice@example.com", password="oldpass123"
        )
        self.client = APIClient()

    def test_password_reset_request_sends_email(self):
        resp = self.client.post("/auth/password-reset/", {"email": "alice@example.com"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Reset your JAM", mail.outbox[0].subject)

    def test_password_reset_request_nonexistent_email(self):
        resp = self.client.post("/auth/password-reset/", {"email": "nonexistent@example.com"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_password_reset_confirm_success(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        resp = self.client.post("/auth/password-reset/confirm/", {
            "uid": uid,
            "token": token,
            "new_password1": "newsecurepass123",
            "new_password2": "newsecurepass123",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newsecurepass123"))

    def test_password_reset_confirm_mismatch(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        resp = self.client.post("/auth/password-reset/confirm/", {
            "uid": uid,
            "token": token,
            "new_password1": "newpass123",
            "new_password2": "differentpass",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_confirm_invalid_token(self):
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        resp = self.client.post("/auth/password-reset/confirm/", {
            "uid": uid,
            "token": "invalid-token",
            "new_password1": "newpass123",
            "new_password2": "newpass123",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_confirm_invalid_uid(self):
        resp = self.client.post("/auth/password-reset/confirm/", {
            "uid": "invalid-uid",
            "token": "some-token",
            "new_password1": "newpass123",
            "new_password2": "newpass123",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
