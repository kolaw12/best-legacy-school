"""
Auto-provisions an invitation (User + UserProfile) the moment a Teacher or a
new Guardian is created through the admin UI. Instead of generating a random
password and emailing it, we send an invite link so the user sets their own
password — keeping credentials out of the admin's hands.

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
from django.utils import timezone

from .models import UserProfile, Invitation


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


def _send_invite_email(email, first_name, token):
    def send():
        invite_url = f"{settings.FRONTEND_URL}/accept-invite?token={token}"
        subject = "You're invited to Best Legacy Divine School portal"
        message = (
            f"Hello {first_name},\n\n"
            f"You've been invited to create an account on the Best Legacy "
            f"Divine School portal.\n\n"
            f"Click the link below to set your password:\n\n"
            f"{invite_url}\n\n"
            f"This link expires in 7 days.\n\n"
            f"— Best Legacy Divine School"
        )
        try:
            send_mail(subject, message, settings.EMAIL_HOST_USER, [email], fail_silently=False)
        except Exception as e:  # noqa: BLE001
            print(f"ERROR: Failed to send invite email to {email}: {e}")

    threading.Thread(target=send).start()


def provision_login(*, email, first_name, last_name, role, teacher=None, guardian=None):
    """
    Create an Invitation record and email the invite link. No-op (returns
    None) if there's no email address.

    Returns the invitation token URL alongside the profile so the caller can
    surface it in the API response — the invite email is fire-and-forget
    with no delivery guarantee, so the admin UI is the only reliable fallback.
    """
    if not email:
        return None

    username = _unique_username(email)
    # Create the User as inactive until they accept the invite
    user = User.objects.create_user(
        username=username, email=email, password=None,
        first_name=first_name or "", last_name=last_name or "",
        is_active=True,  # active=True so they can accept the invite
    )
    profile = UserProfile.objects.create(
        user=user, role=role, teacher=teacher, guardian=guardian,
    )

    token = Invitation.generate_token()
    invitation = Invitation.objects.create(
        email=email,
        role=Invitation.ROLE_CHOICES[0][0],  # default; overridden by caller if needed
        token=token,
        first_name=first_name or "",
        last_name=last_name or "",
        teacher=teacher,
        guardian=guardian,
        expires_at=timezone.now() + timezone.timedelta(days=7),
    )

    _send_invite_email(email, first_name or "there", token)

    invite_url = f"{settings.FRONTEND_URL}/accept-invite?token={token}"
    return {"profile": profile, "username": username, "invite_url": invite_url}
