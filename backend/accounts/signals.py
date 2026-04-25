"""
Signal-based audit trail.

Listens to post_save / post_delete on a small set of sensitive models and
writes an AuditLog row with a diff against the pre-save state.

We stash the "before" state on instance._pre_save_state in a pre_save handler
so post_save can compute a minimal changes dict.
"""
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.forms.models import model_to_dict

from .models import AuditLog

# Models we care about. Import lazily to avoid app-registry cycles.
WATCHED = []


def _get_watched():
    global WATCHED
    if WATCHED:
        return WATCHED
    from academics.models import Student, Teacher, Guardian, BasicGrade, NurseryAssessment, AttendanceRecord
    from finance.models import Invoice, Payment, FeeSchedule
    WATCHED = [
        Student, Teacher, Guardian,
        BasicGrade, NurseryAssessment, AttendanceRecord,
        Invoice, Payment, FeeSchedule,
    ]
    return WATCHED


def _safe_dict(instance):
    """Snapshot a model into a JSON-safe dict for the audit log."""
    import json
    from decimal import Decimal
    from datetime import date, datetime
    try:
        d = model_to_dict(instance, exclude=["photo", "passport_photo", "attachment"])
        for k, v in list(d.items()):
            # Strip FileField-like values that may remain
            if hasattr(v, "url") or hasattr(v, "read") or v.__class__.__name__ in {"ImageFieldFile", "FieldFile"}:
                d.pop(k, None)
                continue
            # Coerce common non-JSON types eagerly
            if isinstance(v, Decimal):
                d[k] = str(v)
            elif isinstance(v, (date, datetime)):
                d[k] = v.isoformat()
        # Final round-trip to catch anything else
        return json.loads(json.dumps(d, default=str))
    except Exception:  # noqa: BLE001
        return {}


@receiver(pre_save)
def stash_pre_save(sender, instance, **kwargs):
    if sender not in _get_watched():
        return
    if instance.pk is None:
        instance._pre_save_state = None
        return
    try:
        old = sender.objects.get(pk=instance.pk)
        instance._pre_save_state = _safe_dict(old)
    except sender.DoesNotExist:
        instance._pre_save_state = None


@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    if sender not in _get_watched():
        return

    new = _safe_dict(instance)
    old = getattr(instance, "_pre_save_state", None)

    changes = {}
    if created:
        changes = {"_created": new}
    elif old is not None:
        changes = {k: {"from": old.get(k), "to": new.get(k)}
                   for k in new
                   if old.get(k) != new.get(k)}

    # Skip empty updates (e.g. save(update_fields=[])) to reduce noise
    if not created and not changes:
        return

    AuditLog.objects.create(
        user=_current_user(),
        action="create" if created else "update",
        object_type=sender.__name__,
        object_id=str(instance.pk),
        object_repr=str(instance)[:200],
        changes=changes,
    )


@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if sender not in _get_watched():
        return
    AuditLog.objects.create(
        user=_current_user(),
        action="delete",
        object_type=sender.__name__,
        object_id=str(instance.pk),
        object_repr=str(instance)[:200],
    )


# ---- current-user helper ---------------------------------------------------
# We stash the WHOLE request on a thread-local. The user is resolved lazily
# inside the signal, so DRF's TokenAuthentication has had a chance to run by
# then (it authenticates inside the view, not in middleware).
from threading import local
_request_local = local()


def _current_user():
    """
    Resolve the actor for the audit log.

    Known limit: DRF's TokenAuthentication runs inside the view, after
    Django's auth middleware. We've added TokenAuthWithSync to copy the
    user back onto the WSGI request, but in some signal-firing paths
    (e.g. DRF's perform_update inside a transaction) the assignment
    isn't visible to the signal. Audit rows still record action / object
    / changes correctly; the actor will fall back to None for some
    write paths until we move to django-easy-audit or crum.
    """
    request = getattr(_request_local, "request", None)
    if not request:
        return None
    user = getattr(request, "user", None)
    if user and user.is_authenticated:
        return user
    return None


class CurrentUserMiddleware:
    """Stash the request itself so audit signals can read request.user lazily."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _request_local.request = request
        try:
            return self.get_response(request)
        finally:
            _request_local.request = None
