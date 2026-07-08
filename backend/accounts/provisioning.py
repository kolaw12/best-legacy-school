"""
Auto-provisions a login (User + UserProfile) the moment a Teacher or a new
Guardian is created through the admin UI. Before this, the admin console
could create Teacher/Student/Guardian *data* records, but nothing anywhere
ever created the actual login that lets that person sign in — someone had
to separately go into Django's raw /admin/ panel and wire up a User by hand.

Mirrors the existing fire-and-forget email pattern used by the admissions
acceptance email (core.views.AdmissionViewSet._send_email_async) rather than
blocking the request on SMTP.
"""
import secrets
import string
import threading

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail

from .models import UserProfile


def _generate_password(length=12):
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _unique_username(base):
    username = base
    n = 1
    while User.objects.filter(username=username).exists():
        n += 1
        username = f"{base}{n}"
    return username


def _send_credentials_email(email, first_name, username, password):
    def send():
        subject = "Your Best Legacy Divine School portal login"
        message = (
            f"Hello {first_name},\n\n"
            f"An account has been created for you on the Best Legacy Divine "
            f"School parent/staff portal.\n\n"
            f"Username: {username}\n"
            f"Password: {password}\n\n"
            f"Log in at {settings.FRONTEND_URL}/admin-login and change your "
            f"password once you're in.\n\n"
            f"— Best Legacy Divine School"
        )
        try:
            send_mail(subject, message, settings.EMAIL_HOST_USER, [email], fail_silently=False)
        except Exception as e:  # noqa: BLE001
            print(f"ERROR: Failed to send login-credentials email to {email}: {e}")

    threading.Thread(target=send).start()


def provision_login(*, email, first_name, last_name, role, teacher=None, guardian=None):
    """
    Create a User + UserProfile with a random password and email the
    credentials. No-op (returns None) if there's no email address — there'd
    be no way for that person to ever receive the password.

    Returns the plaintext username/password alongside the profile so the
    caller can surface them once in the API response — the credentials email
    is fire-and-forget and has no delivery guarantee (no SMTP configured =
    silently never arrives), so the admin UI is the only reliable fallback.
    """
    if not email:
        return None

    username = _unique_username(email)
    password = _generate_password()
    user = User.objects.create_user(
        username=username, email=email, password=password,
        first_name=first_name or "", last_name=last_name or "",
    )
    profile = UserProfile.objects.create(
        user=user, role=role, teacher=teacher, guardian=guardian,
    )
    _send_credentials_email(email, first_name or "there", username, password)
    return {"profile": profile, "username": username, "password": password}
