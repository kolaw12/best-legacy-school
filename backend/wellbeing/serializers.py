from rest_framework import serializers
from .models import (
    HealthLog, BehaviourEntry, SchoolEvent, SafeguardingIncident,
    DrillLog, MoodPulse, PupilBadge, StaffCertification,
    PolicyAcknowledgement, CurriculumStrand, ReadingLevel, CommentBankEntry,
)


class _StudentMixin:
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    class_name   = serializers.CharField(source="student.class_level.name", read_only=True)


class HealthLogSerializer(serializers.ModelSerializer, _StudentMixin):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    class_name   = serializers.CharField(source="student.class_level.name", read_only=True)
    severity_label = serializers.CharField(source="get_severity_display", read_only=True)
    nurse_name   = serializers.SerializerMethodField()

    class Meta:
        model = HealthLog
        fields = [
            "id", "student", "student_name", "admission_no", "class_name",
            "visited_at", "complaint", "action_taken", "severity", "severity_label",
            "sent_home", "guardian_notified", "note",
            "nurse", "nurse_name", "created_at",
        ]
        read_only_fields = ("nurse",)

    def get_nurse_name(self, obj):
        return obj.nurse.get_full_name() or obj.nurse.username if obj.nurse else None


class BehaviourEntrySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    class_name   = serializers.CharField(source="student.class_level.name", read_only=True)
    kind_label   = serializers.CharField(source="get_kind_display", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)

    class Meta:
        model = BehaviourEntry
        fields = [
            "id", "student", "student_name", "admission_no", "class_name",
            "kind", "kind_label", "points", "title", "detail",
            "teacher", "teacher_name", "term",
            "is_visible_to_parent", "created_at",
        ]


class SchoolEventSerializer(serializers.ModelSerializer):
    kind_label     = serializers.CharField(source="get_kind_display", read_only=True)
    audience_label = serializers.CharField(source="get_audience_display", read_only=True)
    is_multi_day   = serializers.BooleanField(read_only=True)

    class Meta:
        model = SchoolEvent
        fields = [
            "id", "title", "description",
            "start_date", "end_date", "starts_at", "ends_at", "location",
            "kind", "kind_label", "audience", "audience_label",
            "is_published", "is_multi_day", "created_at",
        ]


class SafeguardingIncidentSerializer(serializers.ModelSerializer):
    student_name   = serializers.CharField(source="student.full_name", read_only=True)
    severity_label = serializers.CharField(source="get_severity_display", read_only=True)
    status_label   = serializers.CharField(source="get_status_display", read_only=True)
    filed_by_name  = serializers.SerializerMethodField()

    class Meta:
        model = SafeguardingIncident
        fields = [
            "id", "student", "student_name", "summary", "detail",
            "severity", "severity_label", "status", "status_label",
            "filed_by", "filed_by_name", "triaged_by", "triage_note",
            "occurred_at", "closed_at", "created_at", "updated_at",
        ]
        read_only_fields = ("filed_by", "triaged_by", "closed_at")

    def get_filed_by_name(self, obj):
        if not obj.filed_by:
            return None
        return obj.filed_by.get_full_name() or obj.filed_by.username


class DrillLogSerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = DrillLog
        fields = ["id", "kind", "kind_label", "held_at", "duration_seconds",
                  "pupils_count", "staff_count", "observations", "led_by", "created_at"]


class MoodPulseSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    mood_label   = serializers.CharField(source="get_mood_display", read_only=True)

    class Meta:
        model = MoodPulse
        fields = ["id", "student", "student_name", "mood", "mood_label", "note", "pulsed_on", "created_at"]


class PupilBadgeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = PupilBadge
        fields = ["id", "student", "student_name", "code", "label", "icon",
                  "awarded_on", "note", "created_at"]


class StaffCertificationSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = StaffCertification
        fields = ["id", "user", "user_name", "title", "issuer", "issued_on",
                  "expires_on", "document", "note", "created_at"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class PolicyAcknowledgementSerializer(serializers.ModelSerializer):
    user_name    = serializers.SerializerMethodField()
    policy_label = serializers.CharField(source="get_policy_display", read_only=True)

    class Meta:
        model = PolicyAcknowledgement
        fields = ["id", "user", "user_name", "policy", "policy_label",
                  "version", "acknowledged_at", "ip"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class CurriculumStrandSerializer(serializers.ModelSerializer):
    class_name   = serializers.CharField(source="class_level.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = CurriculumStrand
        fields = ["id", "class_level", "class_name", "subject", "subject_name",
                  "term", "title", "description", "week_number", "is_covered",
                  "note", "created_at", "updated_at"]


class ReadingLevelSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = ReadingLevel
        fields = ["id", "student", "student_name", "term", "level",
                  "fluency_wpm", "note", "assessed_on", "teacher", "created_at"]


class CommentBankEntrySerializer(serializers.ModelSerializer):
    band_label = serializers.CharField(source="get_band_display", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = CommentBankEntry
        fields = ["id", "subject", "subject_name", "band", "band_label",
                  "text", "times_used", "created_at"]
