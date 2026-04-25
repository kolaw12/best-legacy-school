"""
Authentication + role model for Best Legacy Divine School.

We extend Django's built-in User with a one-to-one UserProfile that carries
the role (RBAC) and optional links to a Teacher or Student record. This keeps
the default auth stack intact while adding a single authoritative role field.
"""
from django.conf import settings
from django.db import models


class Role(models.TextChoices):
    SUPER_ADMIN     = "super_admin",     "Super Admin"
    SCHOOL_ADMIN    = "school_admin",    "School Admin"
    TEACHER         = "teacher",         "Teacher"
    STUDENT         = "student",         "Student"
    PARENT          = "parent",          "Parent / Guardian"
    ACCOUNTANT      = "accountant",      "Accountant"
    CONTENT_MANAGER = "content_manager", "Content Manager"


ADMIN_ROLES = {Role.SUPER_ADMIN, Role.SCHOOL_ADMIN}
STAFF_ROLES = ADMIN_ROLES | {Role.TEACHER, Role.ACCOUNTANT, Role.CONTENT_MANAGER}


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    role = models.CharField(
        max_length=30, choices=Role.choices, default=Role.STUDENT
    )
    phone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to="profiles/", blank=True, null=True)

    # Optional links to domain records — populated for teacher/student/parent roles.
    teacher = models.OneToOneField(
        "academics.Teacher", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="user_profile",
    )
    student = models.OneToOneField(
        "academics.Student", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="user_profile",
    )
    guardian = models.ForeignKey(
        "academics.Guardian", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="user_profiles",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__username"]

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

    # -- Helpers --------------------------------------------------------------
    @property
    def is_admin(self):
        return self.role in ADMIN_ROLES

    @property
    def is_staff_member(self):
        return self.role in STAFF_ROLES


class AuditLog(models.Model):
    """A lightweight audit trail for write operations on sensitive models."""
    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("login",  "Login"),
        ("logout", "Logout"),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="audit_entries",
    )
    action      = models.CharField(max_length=20, choices=ACTION_CHOICES)
    object_type = models.CharField(max_length=60, blank=True, help_text="e.g. Student, Payment")
    object_id   = models.CharField(max_length=40, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    changes     = models.JSONField(default=dict, blank=True)
    ip          = models.CharField(max_length=45, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} · {self.user_id or '—'} · {self.action} {self.object_type}#{self.object_id}"


class Announcement(models.Model):
    """Broadcast message visible across portals.

    Audience controls who sees it: 'all' / 'parents' / 'teachers' / 'admins'.
    A read-state row is created lazily when a user dismisses the notification
    (no need to pre-fan-out — saves writes at scale).
    """
    AUDIENCE_CHOICES = [
        ("all",      "Everyone"),
        ("parents",  "Parents only"),
        ("teachers", "Teachers only"),
        ("admins",   "Admins only"),
    ]
    title    = models.CharField(max_length=200)
    body     = models.TextField()
    audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES, default="all")
    pinned   = models.BooleanField(default=False, help_text="Pin to the top until expiry/manual unpin")
    starts_at = models.DateTimeField(null=True, blank=True, help_text="Show only after this time")
    expires_at = models.DateTimeField(null=True, blank=True, help_text="Hide after this time")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="announcements",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-pinned", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.audience})"


class AnnouncementRead(models.Model):
    """Per-user dismiss / read marker. Created when the user dismisses or opens."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="announcement_reads"
    )
    announcement = models.ForeignKey(
        Announcement, on_delete=models.CASCADE, related_name="reads"
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "announcement")]


# ===== Direct messaging (parent ↔ teacher / staff) =========================
class MessageThread(models.Model):
    """A 1:1 (or small-group) conversation. Anchored to a Student so the
    message history travels with the child rather than the user account."""
    student = models.ForeignKey(
        "academics.Student", on_delete=models.CASCADE, related_name="message_threads",
        null=True, blank=True, help_text="Optional anchor — most threads are about a specific child.",
    )
    subject = models.CharField(max_length=200, blank=True)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="message_threads",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="threads_started",
    )
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-last_message_at", "-created_at"]

    def __str__(self):
        return self.subject or f"Thread #{self.id}"


class Message(models.Model):
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="messages_sent",
    )
    body = models.TextField()
    attachment = models.FileField(upload_to="messages/", blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True, db_index=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["sent_at"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Roll up the thread timestamp so list views sort newest-first.
        from django.utils import timezone
        MessageThread.objects.filter(pk=self.thread_id).update(last_message_at=self.sent_at or timezone.now())

    def __str__(self):
        return f"{self.author_id} → thread {self.thread_id} · {self.sent_at:%d %b %H:%M}"


class MessageRead(models.Model):
    """Per-user read marker. Lazy: only created when a user opens the thread."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="message_reads"
    )
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name="reads")
    last_read_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("user", "thread")]
