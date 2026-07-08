"""
Tests for core.secure_media — the signed-URL gate that replaced the old
unauthenticated /media/ catch-all for student/staff/pickup-auth/passport
photos (see school_project/urls.py). A regression here would silently
reopen that exposure, so every failure mode gets its own case.
"""
import os

import pytest
from django.conf import settings

from core.secure_media import build_secure_url, sign_media_path


@pytest.fixture
def protected_file(tmp_path, settings):
    """A real file under a temporary MEDIA_ROOT, so the view has something
    legitimate to serve without touching the real media/ directory."""
    settings.MEDIA_ROOT = str(tmp_path)
    folder = tmp_path / "students"
    folder.mkdir()
    file_path = folder / "example.jpg"
    file_path.write_bytes(b"not-really-a-jpeg")
    return "students/example.jpg"


@pytest.mark.django_db
class TestSecureMedia:
    def test_valid_signed_token_serves_the_file(self, api_client, protected_file):
        token = sign_media_path(protected_file)
        response = api_client.get(f"/secure-media/?token={token}")
        assert response.status_code == 200
        assert b"".join(response.streaming_content) == b"not-really-a-jpeg"

    def test_missing_token_is_rejected(self, api_client):
        response = api_client.get("/secure-media/")
        assert response.status_code == 404

    def test_tampered_token_is_rejected(self, api_client, protected_file):
        token = sign_media_path(protected_file)
        response = api_client.get(f"/secure-media/?token={token}TAMPERED")
        assert response.status_code == 404

    def test_expired_token_is_rejected(self, api_client, protected_file, monkeypatch):
        import core.secure_media as secure_media_module
        monkeypatch.setattr(secure_media_module, "MAX_AGE_SECONDS", 0)
        token = sign_media_path(protected_file)
        response = api_client.get(f"/secure-media/?token={token}")
        assert response.status_code == 404

    def test_path_traversal_attempt_is_rejected(self, api_client, tmp_path, settings):
        settings.MEDIA_ROOT = str(tmp_path)
        # Sign a path that tries to escape MEDIA_ROOT. Even though the
        # signature is technically valid for this string, the view must
        # still refuse anything that normalises outside MEDIA_ROOT.
        escaping_token = sign_media_path("../../../../etc/passwd")
        response = api_client.get(f"/secure-media/?token={escaping_token}")
        assert response.status_code == 404

    def test_nonexistent_file_is_a_404_not_a_500(self, api_client, tmp_path, settings):
        settings.MEDIA_ROOT = str(tmp_path)
        token = sign_media_path("students/does-not-exist.jpg")
        response = api_client.get(f"/secure-media/?token={token}")
        assert response.status_code == 404


class TestBuildSecureUrl:
    def test_returns_none_for_empty_field(self):
        assert build_secure_url(request=None, file_field=None) is None

    def test_embeds_a_valid_token_for_a_real_field(self):
        class FakeFieldFile:
            name = "staff/photo.jpg"

            def __bool__(self):
                return True

        url = build_secure_url(request=None, file_field=FakeFieldFile())
        assert url.startswith("/secure-media/?token=")
