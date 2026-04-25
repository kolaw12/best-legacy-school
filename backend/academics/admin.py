from django.contrib import admin
from .models import (
    Session, Term, ClassLevel, Subject,
    Guardian, Teacher, Student, Enrollment, AttendanceRecord,
    BasicGrade, NurseryAssessment, PickupAuthorization,
)


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("name", "start_date", "end_date", "is_current")
    list_filter = ("is_current",)
    search_fields = ("name",)
    ordering = ("-start_date",)
    # needed for autocomplete_fields from Enrollment/Student admin
    # (search_fields above enables it)


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ("name", "session", "start_date", "end_date", "is_current")
    list_filter = ("is_current", "session", "name")
    search_fields = ("name", "session__name")
    ordering = ("-session__start_date", "start_date")


@admin.register(ClassLevel)
class ClassLevelAdmin(admin.ModelAdmin):
    list_display = ("order", "name", "section", "student_count")
    list_filter = ("section",)
    search_fields = ("name",)
    ordering = ("order",)

    def student_count(self, obj):
        return obj.students.filter(status="active").count()
    student_count.short_description = "Active Students"


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "section", "code")
    list_filter = ("section",)
    search_fields = ("name", "code")
    ordering = ("section", "name")


@admin.register(Guardian)
class GuardianAdmin(admin.ModelAdmin):
    list_display = ("full_name", "relationship", "phone", "email", "children_count")
    list_filter = ("relationship",)
    search_fields = ("first_name", "last_name", "phone", "email")

    def children_count(self, obj):
        return obj.children.count()
    children_count.short_description = "Children"


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("staff_id", "full_name", "email", "class_teacher_of", "is_active")
    list_filter = ("is_active", "class_teacher_of__section")
    search_fields = ("first_name", "last_name", "email", "staff_id")
    readonly_fields = ("staff_id",)
    filter_horizontal = ("subjects", "classes")


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 0
    autocomplete_fields = ("class_level", "session")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("admission_no", "full_name", "class_level", "gender", "status", "guardian")
    list_filter = ("status", "gender", "class_level__section", "class_level")
    search_fields = ("first_name", "last_name", "admission_no", "guardian__last_name")
    readonly_fields = ("admission_no",)
    autocomplete_fields = ("guardian", "class_level", "current_session", "source_admission")
    inlines = [EnrollmentInline]


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "class_level", "session", "status", "enrolled_on")
    list_filter = ("status", "session", "class_level")
    search_fields = ("student__first_name", "student__last_name", "student__admission_no")
    autocomplete_fields = ("student", "class_level", "session")


@admin.register(AttendanceRecord)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("student", "class_level", "date", "status", "marked_by")
    list_filter = ("status", "date", "class_level")
    search_fields = ("student__first_name", "student__last_name", "student__admission_no")
    autocomplete_fields = ("student", "class_level", "marked_by")
    date_hierarchy = "date"


@admin.register(BasicGrade)
class BasicGradeAdmin(admin.ModelAdmin):
    list_display = ("student", "subject", "term", "ca1", "ca2", "exam", "total", "grade")
    list_filter = ("grade", "term", "subject")
    search_fields = ("student__first_name", "student__last_name", "student__admission_no")
    autocomplete_fields = ("student", "subject", "term", "teacher")
    readonly_fields = ("total", "grade")


@admin.register(NurseryAssessment)
class NurseryAssessmentAdmin(admin.ModelAdmin):
    list_display = ("student", "term", "domain", "rating")
    list_filter = ("rating", "domain", "term")
    search_fields = ("student__first_name", "student__last_name", "student__admission_no")
    autocomplete_fields = ("student", "term", "teacher")


@admin.register(PickupAuthorization)
class PickupAuthorizationAdmin(admin.ModelAdmin):
    list_display = ("name", "student", "relationship", "phone", "is_active", "valid_from", "valid_until")
    list_filter = ("is_active", "relationship")
    search_fields = ("name", "phone", "student__first_name", "student__last_name", "student__admission_no")
    autocomplete_fields = ("student", "added_by")
    readonly_fields = ("added_by", "created_at")


