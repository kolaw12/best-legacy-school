import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from accounts.models import Role, UserProfile


@pytest.fixture
def api_client():
    return APIClient()


def _make_user(db, username, role):
    user = User.objects.create_user(username=username, password="testpass123")
    UserProfile.objects.create(user=user, role=role)
    return user


@pytest.fixture
def admin_user(db):
    return _make_user(db, "admin_test", Role.SCHOOL_ADMIN)


@pytest.fixture
def teacher_user(db):
    return _make_user(db, "teacher_test", Role.TEACHER)


@pytest.fixture
def parent_user(db):
    return _make_user(db, "parent_test", Role.PARENT)


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def teacher_client(api_client, teacher_user):
    api_client.force_authenticate(user=teacher_user)
    return api_client


@pytest.fixture
def parent_client(api_client, parent_user):
    api_client.force_authenticate(user=parent_user)
    return api_client
