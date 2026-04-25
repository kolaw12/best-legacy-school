from django.contrib import admin
from .models import (
    HealthLog, BehaviourEntry, SchoolEvent, SafeguardingIncident,
    DrillLog, MoodPulse, PupilBadge, StaffCertification,
    PolicyAcknowledgement, CurriculumStrand, ReadingLevel, CommentBankEntry,
)


@admin.register(HealthLog)
class HealthLogAdmin(admin.ModelAdmin):
    list_display = ("student", "visited_at", "complaint", "severity", "sent_home", "guardian_notified")
    list_filter  = ("severity", "sent_home", "guardian_notified")
    search_fields = ("complaint", "student__first_name", "student__last_name", "student__admission_no")
    autocomplete_fields = ("student",)
    date_hierarchy = "visited_at"


@admin.register(BehaviourEntry)
class BehaviourEntryAdmin(admin.ModelAdmin):
    list_display = ("student", "kind", "title", "points", "teacher", "is_visible_to_parent", "created_at")
    list_filter  = ("kind", "is_visible_to_parent", "term")
    search_fields = ("title", "detail", "student__first_name", "student__last_name")
    autocomplete_fields = ("student", "teacher", "term")


@admin.register(SchoolEvent)
class SchoolEventAdmin(admin.ModelAdmin):
    list_display = ("title", "start_date", "end_date", "kind", "audience", "is_published")
    list_filter  = ("kind", "audience", "is_published")
    search_fields = ("title", "description", "location")
    date_hierarchy = "start_date"
    ordering = ("start_date",)


@admin.register(SafeguardingIncident)
class SafeguardingIncidentAdmin(admin.ModelAdmin):
    list_display = ("summary", "severity", "status", "filed_by", "occurred_at")
    list_filter  = ("severity", "status")
    search_fields = ("summary", "detail")
    readonly_fields = ("filed_by", "created_at", "updated_at")
    autocomplete_fields = ("student",)


@admin.register(DrillLog)
class DrillLogAdmin(admin.ModelAdmin):
    list_display = ("kind", "held_at", "duration_seconds", "pupils_count", "led_by")
    list_filter  = ("kind",)
    date_hierarchy = "held_at"


@admin.register(MoodPulse)
class MoodPulseAdmin(admin.ModelAdmin):
    list_display = ("student", "pulsed_on", "mood")
    list_filter  = ("mood", "pulsed_on")
    autocomplete_fields = ("student",)
    date_hierarchy = "pulsed_on"


@admin.register(PupilBadge)
class PupilBadgeAdmin(admin.ModelAdmin):
    list_display = ("student", "label", "icon", "awarded_on")
    search_fields = ("label", "code", "student__first_name", "student__last_name")
    autocomplete_fields = ("student",)
    date_hierarchy = "awarded_on"


@admin.register(StaffCertification)
class StaffCertificationAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "issuer", "issued_on", "expires_on")
    list_filter  = ("title",)
    search_fields = ("title", "issuer", "user__username")


@admin.register(PolicyAcknowledgement)
class PolicyAcknowledgementAdmin(admin.ModelAdmin):
    list_display = ("user", "policy", "version", "acknowledged_at")
    list_filter  = ("policy",)


@admin.register(CurriculumStrand)
class CurriculumStrandAdmin(admin.ModelAdmin):
    list_display = ("class_level", "subject", "term", "title", "week_number", "is_covered")
    list_filter  = ("class_level", "subject", "term", "is_covered")
    search_fields = ("title", "description")
    autocomplete_fields = ("class_level", "subject", "term")


@admin.register(ReadingLevel)
class ReadingLevelAdmin(admin.ModelAdmin):
    list_display = ("student", "level", "fluency_wpm", "term", "assessed_on")
    list_filter  = ("level", "term")
    autocomplete_fields = ("student", "term", "teacher")


@admin.register(CommentBankEntry)
class CommentBankEntryAdmin(admin.ModelAdmin):
    list_display = ("band", "subject", "text", "times_used")
    list_filter  = ("band", "subject")
    search_fields = ("text",)
