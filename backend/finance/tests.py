"""Regression test for the finance dashboard summary lockdown.

This endpoint used to be `@permission_classes([AllowAny])` — literally
commented "lock down later" — and returned school-wide fee totals and
recent payments to anyone, logged in or not.
"""
import hashlib
import hmac
import json
from datetime import date
from decimal import Decimal

import pytest
from rest_framework import status

from academics.models import ClassLevel, Guardian, Session, Student, Term
from finance import paystack
from finance.models import FeeSchedule, Invoice, Payment


@pytest.mark.django_db
class TestFinanceSummaryPermissions:
    def test_public_cannot_read_finance_summary(self, api_client):
        response = api_client.get("/api/finance/summary/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_staff_can_read_finance_summary(self, admin_client):
        response = admin_client.get("/api/finance/summary/")
        assert response.status_code == status.HTTP_200_OK


class TestWebhookSignatureValid:
    """Unit tests for the pure HMAC check — no DB, no server required.
    This is the one thing standing between the payments table and anyone
    on the internet who can POST JSON, so every failure mode gets a case.
    """

    def test_valid_signature_is_accepted(self, monkeypatch):
        monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_secret")
        body = b'{"event": "charge.success"}'
        sig = hmac.new(b"sk_test_secret", body, hashlib.sha512).hexdigest()
        assert paystack.webhook_signature_valid(body, sig) is True

    def test_wrong_secret_is_rejected(self, monkeypatch):
        monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_secret")
        body = b'{"event": "charge.success"}'
        sig = hmac.new(b"wrong_secret", body, hashlib.sha512).hexdigest()
        assert paystack.webhook_signature_valid(body, sig) is False

    def test_tampered_body_is_rejected(self, monkeypatch):
        monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_secret")
        original_body = b'{"event": "charge.success", "data": {"amount": 100}}'
        sig = hmac.new(b"sk_test_secret", original_body, hashlib.sha512).hexdigest()
        tampered_body = b'{"event": "charge.success", "data": {"amount": 999999}}'
        assert paystack.webhook_signature_valid(tampered_body, sig) is False

    def test_missing_signature_header_is_rejected(self, monkeypatch):
        monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_secret")
        assert paystack.webhook_signature_valid(b"{}", "") is False

    def test_missing_secret_key_rejects_everything(self, monkeypatch):
        # If PAYSTACK_SECRET_KEY was never configured, nothing should ever
        # verify — fail closed, not open.
        monkeypatch.delenv("PAYSTACK_SECRET_KEY", raising=False)
        body = b'{"event": "charge.success"}'
        assert paystack.webhook_signature_valid(body, "any-signature-at-all") is False


@pytest.fixture
def unpaid_invoice(db):
    academic_session = Session.objects.create(
        name="2025/2026", start_date=date(2025, 9, 1), end_date=date(2026, 7, 31), is_current=True,
    )
    term = Term.objects.create(
        session=academic_session, name="first", start_date=date(2025, 9, 1), end_date=date(2025, 12, 15), is_current=True,
    )
    class_level = ClassLevel.objects.create(name="Basic 1", section="basic", order=1)
    guardian = Guardian.objects.create(first_name="Grace", last_name="Lovelace", phone="08012345678")
    student = Student.objects.create(
        first_name="Ada", last_name="Lovelace", date_of_birth=date(2018, 5, 1), gender="F",
        class_level=class_level, current_session=academic_session, guardian=guardian,
    )
    fee_schedule = FeeSchedule.objects.create(
        class_level=class_level, term=term, name="Tuition", amount=Decimal("95000"),
    )
    return Invoice.objects.create(
        student=student, fee_schedule=fee_schedule, term=term, amount_due=Decimal("95000"),
    )


@pytest.mark.django_db
class TestPaystackWebhookEndpoint:
    def _post_webhook(self, api_client, payload, secret="sk_test_secret", sign=True):
        body = json.dumps(payload).encode("utf-8")
        headers = {}
        if sign:
            headers["HTTP_X_PAYSTACK_SIGNATURE"] = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()
        return api_client.post(
            "/api/finance/paystack/webhook/", data=body, content_type="application/json", **headers,
        )

    def test_invalid_signature_is_rejected_before_touching_the_db(self, api_client, monkeypatch):
        monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_secret")
        response = self._post_webhook(api_client, {"event": "charge.success", "data": {}}, secret="wrong-secret")
        assert response.status_code == 400

    def test_valid_signature_with_matching_invoice_records_a_payment(self, api_client, monkeypatch, unpaid_invoice):
        monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_secret")
        payload = {
            "event": "charge.success",
            "data": {
                "reference": "test-ref-001",
                "amount": 9_500_000,  # kobo
                "metadata": {"invoice_id": unpaid_invoice.id},
            },
        }
        response = self._post_webhook(api_client, payload)
        assert response.status_code == 200
        assert response.data.get("recorded") is True
        assert Payment.objects.filter(reference="test-ref-001", invoice=unpaid_invoice).exists()

    def test_replayed_reference_is_not_recorded_twice(self, api_client, monkeypatch, unpaid_invoice):
        monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_secret")
        payload = {
            "event": "charge.success",
            "data": {
                "reference": "test-ref-002",
                "amount": 9_500_000,
                "metadata": {"invoice_id": unpaid_invoice.id},
            },
        }
        first = self._post_webhook(api_client, payload)
        second = self._post_webhook(api_client, payload)
        assert first.status_code == second.status_code == 200
        assert Payment.objects.filter(reference="test-ref-002").count() == 1
