"""
Email notification signals.

Sends emails for key events:
- Fee payment recorded → email to parent
- Announcement posted → email to relevant audience
"""
import logging
import threading
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _send_async(subject, message, recipient_list):
    """Send email in background thread so it doesn't slow down the request."""
    def _send():
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@bestlegacy.sch'),
                recipient_list=recipient_list,
                fail_silently=True,
            )
        except Exception as e:
            logger.warning(f'Email send failed: {e}')
    threading.Thread(target=_send, daemon=True).start()


@receiver(post_save, sender='finance.Payment')
def notify_payment_received(sender, instance, created, **kwargs):
    """Email parent when a payment is recorded."""
    if not created:
        return

    invoice = instance.invoice
    student = invoice.student
    guardian = student.guardian
    if not guardian or not guardian.email:
        return

    _send_async(
        subject=f'Payment Received — {student.full_name}',
        message=(
            f'Dear {guardian.full_name},\n\n'
            f'We have received a payment of {instance.amount:,.0f} for {student.full_name}.\n\n'
            f'Invoice: {invoice.invoice_no}\n'
            f'Receipt: {instance.receipt_no}\n'
            f'Method: {instance.get_method_display()}\n'
            f'Date: {instance.received_on}\n\n'
            f'Balance: {invoice.balance:,.0f}\n\n'
            f'Best Legacy Divine School'
        ),
        recipient_list=[guardian.email],
    )


@receiver(post_save, sender='accounts.Announcement')
def notify_announcement_posted(sender, instance, created, **kwargs):
    """Email relevant users when an announcement is posted."""
    if not created:
        return

    from accounts.models import UserProfile, Role

    audience = instance.audience or 'all'
    if audience == 'all':
        profiles = UserProfile.objects.select_related('user').exclude(user__email='')
    elif audience == 'parents':
        profiles = UserProfile.objects.filter(role=Role.PARENT).select_related('user').exclude(user__email='')
    elif audience == 'teachers':
        profiles = UserProfile.objects.filter(role=Role.TEACHER).select_related('user').exclude(user__email='')
    else:
        profiles = UserProfile.objects.none()

    emails = [p.user.email for p in profiles[:50]]  # Cap at 50 to avoid spam
    if not emails:
        return

    _send_async(
        subject=f'New Announcement: {instance.title}',
        message=(
            f'{instance.title}\n\n'
            f'{instance.body}\n\n'
            f'Best Legacy Divine School'
        ),
        recipient_list=emails,
    )
