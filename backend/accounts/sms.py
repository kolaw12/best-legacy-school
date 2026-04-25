"""
Lightweight SMS gateway adapter.

Supports Termii (Nigerian provider, NGN-priced) and AfricasTalking as
fallbacks; selects whichever is configured. If neither is configured, the
adapter no-ops cleanly so the app stays usable on developer laptops.

Set in environment:
  SMS_PROVIDER     = "termii" | "africastalking" | ""    (default: "")
  SMS_FROM         = sender ID (e.g. "BLS School")
  TERMII_API_KEY   = "..."
  TERMII_SENDER_ID = "..."   (overrides SMS_FROM for Termii)
  AT_USERNAME      = "..."
  AT_API_KEY       = "..."
"""
from __future__ import annotations

import os
import logging
from typing import Iterable

logger = logging.getLogger(__name__)


def _provider() -> str:
    return (os.environ.get("SMS_PROVIDER") or "").strip().lower()


def is_configured() -> bool:
    p = _provider()
    if p == "termii":
        return bool(os.environ.get("TERMII_API_KEY"))
    if p == "africastalking":
        return bool(os.environ.get("AT_USERNAME") and os.environ.get("AT_API_KEY"))
    return False


def _normalise_phone(phone: str) -> str:
    """Best-effort E.164 for Nigerian numbers. Accepts 0803…, +234803…, 234803…"""
    p = (phone or "").strip().replace(" ", "").replace("-", "")
    if not p:
        return ""
    if p.startswith("+"):
        return p[1:]
    if p.startswith("0") and len(p) == 11:
        return "234" + p[1:]
    if p.startswith("234"):
        return p
    return p  # caller's problem — adapter just sends what it got


def send_sms(phone: str, body: str) -> dict:
    """Send a single SMS. Returns {"ok": bool, "provider": str, "id": str|None, "raw": ...}.
    If unconfigured, logs the message and returns a no-op success so callers
    don't have to special-case dev environments."""
    phone = _normalise_phone(phone)
    if not phone:
        return {"ok": False, "provider": "none", "error": "empty phone"}

    if not is_configured():
        logger.info("[sms:noop] -> %s: %s", phone, body[:80])
        return {"ok": True, "provider": "noop", "id": None, "raw": "Not configured."}

    p = _provider()
    if p == "termii":
        return _send_termii(phone, body)
    if p == "africastalking":
        return _send_africastalking(phone, body)
    return {"ok": False, "provider": p, "error": "Unknown SMS_PROVIDER."}


def send_bulk(phones: Iterable[str], body: str) -> list[dict]:
    return [send_sms(p, body) for p in phones if p]


# ---- Termii ---------------------------------------------------------------
def _send_termii(phone: str, body: str) -> dict:
    import requests
    api_key = os.environ.get("TERMII_API_KEY", "")
    sender  = os.environ.get("TERMII_SENDER_ID") or os.environ.get("SMS_FROM", "BLS")
    payload = {
        "to": phone,
        "from": sender,
        "sms": body,
        "type": "plain",
        "channel": "generic",
        "api_key": api_key,
    }
    try:
        r = requests.post("https://api.ng.termii.com/api/sms/send", json=payload, timeout=10)
        data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text}
        ok = r.status_code == 200 and (data.get("code") == "ok" or data.get("message_id"))
        return {"ok": ok, "provider": "termii", "id": data.get("message_id"), "raw": data}
    except requests.RequestException as e:
        return {"ok": False, "provider": "termii", "error": str(e)}


# ---- AfricasTalking -------------------------------------------------------
def _send_africastalking(phone: str, body: str) -> dict:
    import requests
    username = os.environ.get("AT_USERNAME", "")
    api_key  = os.environ.get("AT_API_KEY", "")
    sender   = os.environ.get("SMS_FROM") or ""
    headers = {
        "apiKey": api_key,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }
    data = {"username": username, "to": phone, "message": body}
    if sender:
        data["from"] = sender
    try:
        r = requests.post("https://api.africastalking.com/version1/messaging",
                          data=data, headers=headers, timeout=10)
        body_json = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text}
        recipients = (body_json.get("SMSMessageData") or {}).get("Recipients") or []
        ok = bool(recipients and recipients[0].get("status", "").lower().startswith("success"))
        msg_id = recipients[0].get("messageId") if recipients else None
        return {"ok": ok, "provider": "africastalking", "id": msg_id, "raw": body_json}
    except requests.RequestException as e:
        return {"ok": False, "provider": "africastalking", "error": str(e)}
