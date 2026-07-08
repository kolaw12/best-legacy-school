from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response


class SoftDeleteViewSetMixin:
    """
    Turns a ModelViewSet's DELETE into a soft-delete, and adds `restore` +
    `purge` detail actions for the trash flow.

    `destroy()` never runs SQL DELETE — it flips is_deleted via
    `instance.soft_delete()`. `restore` and `purge` both need to find rows
    the viewset's normal (alive-only) queryset can't see, so they look the
    object up directly through the model's unfiltered `all_objects` manager
    rather than through `self.get_object()`.
    """

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _get_any_object(self, pk):
        model = self.get_queryset().model
        try:
            instance = model.all_objects.get(pk=pk)
        except model.DoesNotExist:
            raise NotFound()
        self.check_object_permissions(self.request, instance)
        return instance

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        instance = self._get_any_object(pk)
        if not instance.is_deleted:
            return Response({"detail": "This record isn't in the trash."}, status=400)
        instance.restore()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post", "delete"])
    def purge(self, request, pk=None):
        """Permanent, unrecoverable delete — only ever reachable from the trash."""
        instance = self._get_any_object(pk)
        if not instance.is_deleted:
            return Response({"error": "Move this to the trash before permanently deleting it."}, status=400)
        label = str(instance)
        try:
            instance.delete()
        except ProtectedError:
            return Response(
                {"error": f"Can't permanently delete '{label}' — other records still reference it. Reassign or remove those first."},
                status=400,
            )
        return Response({"detail": "purged"}, status=200)


class ProvisionCredentialsMixin:
    """
    Surfaces a freshly auto-provisioned login (see accounts.provisioning) in
    the create response, once, as `provisioned_login: {username, password}`.

    The credentials email has no delivery guarantee — nothing here fails if
    SMTP isn't configured — so this is the only reliable way an admin ever
    sees the password if the email doesn't land. `perform_create` should set
    `self._provisioned` to the dict `provision_login()` returns (or leave it
    unset/None when no login was provisioned).
    """

    def create(self, request, *args, **kwargs):
        self._provisioned = None
        response = super().create(request, *args, **kwargs)
        if self._provisioned:
            response.data["provisioned_login"] = {
                "username": self._provisioned["username"],
                "password": self._provisioned["password"],
            }
        return response
