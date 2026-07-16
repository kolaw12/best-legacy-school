import base64
from functools import lru_cache
from pathlib import Path

_STATIC_DIR = Path(__file__).resolve().parent / "static" / "core"


def _data_uri(filename, mime):
    path = _STATIC_DIR / filename
    if not path.exists():
        return None
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")


@lru_cache(maxsize=1)
def logo_data_uri():
    """Base64 data URI for the school crest, embedded so xhtml2pdf (which
    can't fetch /static/ over HTTP) can render it without a link_callback."""
    return _data_uri("logo.png", "image/png")


@lru_cache(maxsize=1)
def letterhead_bg_data_uri():
    """Base64 data URI for the official letterhead sheet, used as the full-page
    background on every printed/PDF document (report cards, receipts, etc)."""
    return _data_uri("letterhead-bg.jpeg", "image/jpeg")
