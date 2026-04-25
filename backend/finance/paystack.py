"""
Paystack adapter — server-side init + webhook verify.

The whole module is a NO-OP without the keys set, so the rest of the system
keeps working in dev / before live keys are wired.

Production wiring (see PRODUCTION_HARDENING.md):
    PAYSTACK_PUBLIC_KEY   = pk_test_... or pk_live_...   (frontend reads VITE_PAYSTACK_PUBLIC_KEY)
    PAYSTACK_SECRET_KEY   = sk_test_... or sk_live_...
    PAYSTACK_WEBHOOK_SECRET = the value Paystack signs requests with (recommended)
"""
import hashlib
import hmac
import json
import os
from decimal import Decimal

import urllib.request
import urllib.error


PAYSTACK_BASE = "https://api.paystack.co"


def _secret() -> str:
    return os.environ.get("PAYSTACK_SECRET_KEY", "")


def is_configured() -> bool:
    return bool(_secret())


def initialize_transaction(*, email: str, amount_kobo: int, reference: str,
                           callback_url: str = "", metadata: dict | None = None) -> dict:
    """Begin a Paystack checkout. Returns Paystack's response dict.
    Raises RuntimeError on missing keys or transport error.
    """
    if not is_configured():
        raise RuntimeError("Paystack not configured — set PAYSTACK_SECRET_KEY")

    body = {
        "email": email,
        "amount": int(amount_kobo),       # Paystack works in kobo for NGN
        "reference": reference,
        "callback_url": callback_url,
        "metadata": metadata or {},
    }
    req = urllib.request.Request(
        f"{PAYSTACK_BASE}/transaction/initialize",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {_secret()}",
            "Content-Type":  "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"status": False, "message": e.reason, "raw": e.read().decode("utf-8", "ignore")}


def verify_transaction(reference: str) -> dict:
    """Look up a Paystack transaction. Returns Paystack's response dict."""
    if not is_configured():
        raise RuntimeError("Paystack not configured — set PAYSTACK_SECRET_KEY")

    req = urllib.request.Request(
        f"{PAYSTACK_BASE}/transaction/verify/{reference}",
        headers={"Authorization": f"Bearer {_secret()}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"status": False, "message": e.reason, "raw": e.read().decode("utf-8", "ignore")}


def webhook_signature_valid(raw_body: bytes, signature_header: str) -> bool:
    """Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key."""
    if not signature_header or not _secret():
        return False
    digest = hmac.new(_secret().encode("utf-8"), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(digest, signature_header)


def kobo(amount: Decimal | int | float | str) -> int:
    """₦100.50 → 10050 kobo. Paystack expects integers."""
    d = Decimal(str(amount))
    return int((d * 100).quantize(Decimal("1")))
