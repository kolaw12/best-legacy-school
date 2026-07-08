"""Regression test for the academics dashboard summary lockdown.

This endpoint used to be `@permission_classes([AllowAny])` and returned
student/teacher counts, the admissions pipeline, and gender breakdowns
(including recent applicants' names/emails) to anyone, logged in or not.
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestAdminSummaryPermissions:
    def test_public_cannot_read_admin_summary(self, api_client):
        response = api_client.get("/api/academics/summary/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_staff_can_read_admin_summary(self, admin_client):
        response = admin_client.get("/api/academics/summary/")
        assert response.status_code == status.HTTP_200_OK
