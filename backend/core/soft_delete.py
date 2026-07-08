"""
Soft-delete building block shared by every model that needs a trash/restore
flow (Student, Teacher, ClassLevel, Subject, Admission). "Delete" never runs
an actual SQL DELETE for these — it flips is_deleted + stamps deleted_at, so
a record can be restored or, separately, permanently purged later.

`Meta.base_manager_name = "all_objects"` matters here: Django uses a model's
*base* manager (not `objects`) to resolve forward FK/O2O access (e.g.
`student.class_level`) and internal things like on_delete handling. Without
pointing it at the unfiltered manager, soft-deleting a ClassLevel would make
`student.class_level` raise DoesNotExist for every student still assigned to
it, even though nothing about that student changed.
"""
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(is_deleted=False)

    def dead(self):
        return self.filter(is_deleted=True)


class SoftDeleteManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Default manager — hides soft-deleted rows everywhere: dashboards,
    grade entry, attendance, admin list pages, reverse relations.

    Built with `from_queryset` so `.alive()`/`.dead()` are usable directly
    off the manager (`Model.objects.dead()`), not just off a queryset."""
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    """Bypasses the soft-delete filter. Used by the trash view and by
    restore/purge, which must find rows the default manager hides, and set
    as the model's base manager so FK/O2O traversal isn't affected by
    another row's trashed state."""


class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at"])
