"""
Regression tests for the core app's permission lockdown.

Before this suite existed, every viewset in this app inherited DRF's global
default (AllowAny), which meant anyone could read or edit admissions and
inquiries, and could trigger outbound email via `test_email`, without
logging in. These tests pin down the fixed behaviour so it can't silently
regress: public visitors may still submit the admissions/contact forms
(that's the point of a public site), but everything else here requires a
staff or admin session.
"""
import datetime

import pytest
from rest_framework import status

from .models import Admission, Inquiry, StudentResult


def _admission_payload(**overrides):
    payload = {
        "student_name": "Ada Lovelace",
        "date_of_birth": "2018-05-01",
        "gender": "F",
        "class_applying_for": "Nursery 1",
        "parent_name": "Grace Lovelace",
        "phone_number": "08012345678",
        "email": "grace@example.com",
        "address": "1 Analytical Engine Way",
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
class TestAdmissionPermissions:
    def test_public_can_submit_an_application(self, api_client):
        response = api_client.post("/api/admissions/", _admission_payload(), format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["student_id"]  # auto-generated, not blank

    def test_public_cannot_list_applications(self, api_client):
        Admission.objects.create(**_admission_payload(date_of_birth=datetime.date(2018, 5, 1)))
        response = api_client.get("/api/admissions/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_public_cannot_update_an_application(self, api_client):
        admission = Admission.objects.create(
            **_admission_payload(date_of_birth=datetime.date(2018, 5, 1))
        )
        response = api_client.patch(
            f"/api/admissions/{admission.id}/", {"status": "accepted"}, format="json"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_staff_can_list_and_review_applications(self, admin_client):
        Admission.objects.create(**_admission_payload(date_of_birth=datetime.date(2018, 5, 1)))
        response = admin_client.get("/api/admissions/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_public_cannot_trigger_test_email(self, api_client):
        response = api_client.post(
            "/api/admissions/test_email/", {"email": "attacker@example.com"}, format="json"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_staff_can_trigger_test_email(self, admin_client):
        response = admin_client.post(
            "/api/admissions/test_email/", {"email": "admin@example.com"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_teacher_cannot_trigger_test_email(self, teacher_client):
        """test_email is scoped to IsAdmin specifically, not just any staff role."""
        response = teacher_client.post(
            "/api/admissions/test_email/", {"email": "teacher@example.com"}, format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_sequential_ids_do_not_collide(self, api_client):
        first = api_client.post("/api/admissions/", _admission_payload(), format="json")
        second = api_client.post(
            "/api/admissions/", _admission_payload(student_name="Bea Lovelace"), format="json"
        )
        assert first.data["student_id"] != second.data["student_id"]


@pytest.mark.django_db
class TestInquiryPermissions:
    def test_public_can_submit_contact_form(self, api_client):
        response = api_client.post(
            "/api/inquiries/",
            {
                "name": "Visitor",
                "email": "visitor@example.com",
                "subject": "Tour",
                "message": "Can we visit next week?",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_public_cannot_list_inquiries(self, api_client):
        Inquiry.objects.create(
            name="Visitor", email="visitor@example.com", subject="Tour", message="Hi"
        )
        response = api_client.get("/api/inquiries/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_staff_can_list_inquiries(self, admin_client):
        Inquiry.objects.create(
            name="Visitor", email="visitor@example.com", subject="Tour", message="Hi"
        )
        response = admin_client.get("/api/inquiries/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestStudentResultPermissions:
    """No verified public lookup exists for this legacy results table (unlike
    admissions' application_status endpoint), so it must stay staff-only."""

    def test_public_cannot_read_results(self, api_client):
        StudentResult.objects.create(
            student_id="BLS/2026/001",
            student_name="Ada Lovelace",
            subject="Maths",
            score=90,
            grade="A",
        )
        response = api_client.get("/api/results/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_staff_can_read_results(self, admin_client):
        StudentResult.objects.create(
            student_id="BLS/2026/001",
            student_name="Ada Lovelace",
            subject="Maths",
            score=90,
            grade="A",
        )
        response = admin_client.get("/api/results/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPublicEventsAndGalleryStayOpen:
    """Events/gallery are meant to be readable by anyone browsing the site."""

    def test_public_can_list_events(self, api_client):
        response = api_client.get("/api/events/")
        assert response.status_code == status.HTTP_200_OK

    def test_public_cannot_create_events(self, api_client):
        response = api_client.post(
            "/api/events/",
            {"title": "Open Day", "description": "x", "date": "2026-09-01"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
