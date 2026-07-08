from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Stricter, dedicated throttle for the login endpoint — bounds credential
    stuffing / brute-force attempts by IP without borrowing budget from (or
    being loosened by) the general per-anon-request rate everything else uses.
    """
    scope = "login"
