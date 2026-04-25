from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile, AuditLog, Announcement, MessageThread, Message, MessageRead


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    teacher_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "id", "username", "email", "first_name", "last_name", "full_name",
            "role", "role_display", "phone", "photo",
            "teacher", "teacher_name", "student", "student_name",
            "created_at",
        ]

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

    def get_teacher_name(self, obj):
        return obj.teacher.full_name if obj.teacher else None

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else None


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["username"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is deactivated.")
        attrs["user"] = user
        return attrs


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ["id", "created_at", "username", "action", "object_type",
                  "object_id", "object_repr", "changes", "ip"]

    def get_username(self, obj):
        if not obj.user:
            return None
        return obj.user.username


class AnnouncementSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            "id", "title", "body", "audience", "pinned",
            "starts_at", "expires_at", "created_at",
            "created_by", "created_by_name", "is_read",
        ]
        read_only_fields = ("created_by",)

    def get_is_read(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return obj.reads.filter(user=user).exists()

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
        u = obj.created_by
        return f"{u.first_name} {u.last_name}".strip() or u.username


# ===== Direct messaging =====================================================
class MessageSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "thread", "author", "author_name", "author_role",
                  "body", "attachment", "sent_at", "edited_at"]
        read_only_fields = ("author",)

    def get_author_name(self, obj):
        if not obj.author:
            return "Unknown"
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username

    def get_author_role(self, obj):
        prof = getattr(obj.author, "profile", None)
        return prof.get_role_display() if prof else None


class MessageThreadSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    participant_names = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = ["id", "student", "student_name", "subject",
                  "participants", "participant_names", "created_by",
                  "last_message_at", "last_message", "is_closed", "unread", "created_at"]
        read_only_fields = ("created_by", "last_message_at")

    def get_participant_names(self, obj):
        return [
            (f"{u.first_name} {u.last_name}".strip() or u.username)
            for u in obj.participants.all()
        ]

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-sent_at").first()
        if not msg:
            return None
        return {
            "body": msg.body[:120],
            "sent_at": msg.sent_at,
            "author": (f"{msg.author.first_name} {msg.author.last_name}".strip()
                       or msg.author.username) if msg.author else "Unknown",
        }

    def get_unread(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return 0
        marker = obj.reads.filter(user=user).first()
        qs = obj.messages.exclude(author=user)
        if marker:
            qs = qs.filter(sent_at__gt=marker.last_read_at)
        return qs.count()
