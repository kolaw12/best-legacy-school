from django.contrib import admin
from .models import Assignment, Submission


class SubmissionInline(admin.TabularInline):
    model = Submission
    extra = 0
    autocomplete_fields = ("student", "graded_by")
    readonly_fields = ("submitted_at", "graded_at")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "class_level", "subject", "term", "teacher", "due_date", "is_published")
    list_filter = ("is_published", "term", "class_level__section", "class_level")
    search_fields = ("title", "description")
    autocomplete_fields = ("class_level", "subject", "term", "teacher")
    inlines = [SubmissionInline]


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("assignment", "student", "status", "score", "submitted_at")
    list_filter = ("status", "assignment__class_level")
    search_fields = ("student__first_name", "student__last_name", "assignment__title")
    autocomplete_fields = ("assignment", "student", "graded_by")
    readonly_fields = ("submitted_at", "graded_at")
