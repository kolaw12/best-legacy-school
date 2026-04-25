from django.contrib import admin
from .models import (
    UserProfile, AuditLog, Announcement, AnnouncementRead,
    MessageThread, Message, MessageRead,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "phone", "teacher", "student")
    list_filter = ("role",)
    search_fields = ("user__username", "user__first_name", "user__last_name", "user__email")
    autocomplete_fields = ("user", "teacher", "student", "guardian")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "action", "object_type", "object_repr")
    list_filter = ("action", "object_type", "created_at")
    search_fields = ("object_type", "object_repr", "user__username")
    readonly_fields = ("user", "action", "object_type", "object_id", "object_repr", "changes", "ip", "created_at")
    date_hierarchy = "created_at"

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return request.user.is_superuser


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "audience", "pinned", "starts_at", "expires_at", "created_at")
    list_filter = ("audience", "pinned")
    search_fields = ("title", "body")
    readonly_fields = ("created_by",)


@admin.register(AnnouncementRead)
class AnnouncementReadAdmin(admin.ModelAdmin):
    list_display = ("user", "announcement", "read_at")
    list_filter = ("read_at",)
    search_fields = ("user__username", "announcement__title")


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("author", "body", "sent_at", "edited_at")


@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "student", "is_closed", "last_message_at", "created_at")
    list_filter = ("is_closed",)
    search_fields = ("subject", "student__first_name", "student__last_name")
    autocomplete_fields = ("student", "participants", "created_by")
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "thread", "author", "sent_at")
    list_filter = ("sent_at",)
    search_fields = ("body", "author__username")


@admin.register(MessageRead)
class MessageReadAdmin(admin.ModelAdmin):
    list_display = ("user", "thread", "last_read_at")
    list_filter = ("last_read_at",)
