"""
Signed, time-limited access to sensitive uploads (student/staff photos,
pickup-authorisation photos, admission passport photos) that must never be
reachable via a bare, unauthenticated /media/ URL.

The signed token embeds the file's MEDIA-relative path. A token is only ever
handed out inside a JSON response from an RBAC-protected API endpoint (the
viewset/serializer that built it already enforced who's allowed to see it) —
this view's job is just to reject anyone who didn't get the link that way:
tampered paths fail the signature check, and old links expire.
"""
import os

from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.http import FileResponse, Http404

_signer = TimestampSigner(salt="secure-media")
MAX_AGE_SECONDS = 60 * 60 * 6  # 6 hours — long enough for one session, short enough to limit a leaked link


def sign_media_path(relative_path):
    """Turn a MEDIA-relative path (e.g. "students/foo.jpg") into a signed token."""
    return _signer.sign(relative_path)


def build_secure_url(request, file_field):
    """Build an absolute, signed URL for a Django FileField/ImageField, or None if empty."""
    if not file_field:
        return None
    token = sign_media_path(file_field.name)
    path = f"/secure-media/?token={token}"
    return request.build_absolute_uri(path) if request is not None else path


def secure_media_view(request):
    token = request.GET.get("token", "")
    try:
        relative_path = _signer.unsign(token, max_age=MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        raise Http404("This link is invalid or has expired.")

    media_root = os.path.normpath(settings.MEDIA_ROOT)
    full_path = os.path.normpath(os.path.join(media_root, relative_path))
    # Belt and braces: the signature already pins the exact path, but guard
    # against traversal outside MEDIA_ROOT regardless.
    if not (full_path == media_root or full_path.startswith(media_root + os.sep)):
        raise Http404()
    if not os.path.isfile(full_path):
        raise Http404()

    return FileResponse(open(full_path, "rb"))
