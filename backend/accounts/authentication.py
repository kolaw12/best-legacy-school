"""
Custom DRF auth that mirrors the authenticated user back onto the underlying
Django HttpRequest, so audit signals (which run inside model saves during the
view) can resolve `request.user` correctly.

Without this, DRF sets `.user` on the wrapping `rest_framework.request.Request`
but `request._request.user` (the WSGI request) stays as AnonymousUser, leaving
our audit middleware unable to find the actor.
"""
from rest_framework.authentication import TokenAuthentication


class TokenAuthWithSync(TokenAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result:
            user, _token = result
            # Sync onto the underlying WSGI request — middleware reads from there.
            try:
                request._request.user = user
            except AttributeError:
                pass
        return result
