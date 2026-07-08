"""
Tests for authentication and the login rate limit added this session
(see accounts/throttles.py). Before LoginRateThrottle existed, this endpoint
had no bound on attempts at all — a scripted brute-force/credential-stuffing
run against parent/staff/admin accounts was unopposed. `accounts` had no
test file whatsoever before this one.
"""
import pytest
from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework import status


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    # DRF's rate throttles key off the default cache; without clearing it,
    # attempts from an earlier test in the same run would bleed into this one.
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class TestLoginView:
    def test_correct_credentials_return_a_token(self, api_client):
        User.objects.create_user(username="parent1", password="correct-horse-battery")
        response = api_client.post(
            "/api/auth/login/", {"username": "parent1", "password": "correct-horse-battery"}, format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["token"]
        assert response.data["profile"]["role"]

    def test_wrong_password_is_rejected(self, api_client):
        User.objects.create_user(username="parent2", password="correct-horse-battery")
        response = api_client.post(
            "/api/auth/login/", {"username": "parent2", "password": "wrong-password"}, format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "token" not in response.data

    def test_nonexistent_user_gives_the_same_error_shape_as_wrong_password(self, api_client):
        # Deliberately not asserting on wording here — the point is just that
        # this path doesn't 500 and doesn't leak "user does not exist" vs
        # "wrong password" as two different, enumerable outcomes.
        response = api_client.post(
            "/api/auth/login/", {"username": "nobody-here", "password": "whatever"}, format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLoginRateThrottle:
    def test_sixth_attempt_within_a_minute_is_throttled(self, api_client):
        payload = {"username": "attacker-target", "password": "guess"}
        statuses = [
            api_client.post("/api/auth/login/", payload, format="json").status_code
            for _ in range(6)
        ]
        # First five are allowed through to normal auth handling (400, wrong
        # creds); the sixth must be stopped by the throttle before it even
        # reaches the password check.
        assert statuses[:5] == [status.HTTP_400_BAD_REQUEST] * 5
        assert statuses[5] == status.HTTP_429_TOO_MANY_REQUESTS

    def test_throttle_is_scoped_separately_from_other_endpoints(self, api_client):
        # Exhaust the login throttle...
        for _ in range(5):
            api_client.post("/api/auth/login/", {"username": "x", "password": "y"}, format="json")
        assert api_client.post(
            "/api/auth/login/", {"username": "x", "password": "y"}, format="json",
        ).status_code == status.HTTP_429_TOO_MANY_REQUESTS

        # ...a completely unrelated public endpoint must be unaffected.
        response = api_client.get("/api/gallery/")
        assert response.status_code != status.HTTP_429_TOO_MANY_REQUESTS
