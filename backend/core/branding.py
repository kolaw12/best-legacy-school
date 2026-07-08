import base64
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def logo_data_uri():
    """Base64 data URI for the school crest, embedded so xhtml2pdf (which
    can't fetch /static/ over HTTP) can render it without a link_callback."""
    logo_path = Path(__file__).resolve().parent / "static" / "core" / "logo.png"
    if not logo_path.exists():
        return None
    return "data:image/png;base64," + base64.b64encode(logo_path.read_bytes()).decode("ascii")
