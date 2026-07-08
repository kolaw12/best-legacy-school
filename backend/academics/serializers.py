from rest_framework import serializers
from core.secure_media import build_secure_url
from .models import (
    Session, Term, ClassLevel, Subject,
    Guardian, Teacher, Student, Enrollment, AttendanceRecord,
    BasicGrade, NurseryAssessment, PickupAuthorization,
)


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = "__all__"


class TermSerializer(serializers.ModelSerializer):
    session_name = serializers.CharField(source="session.name", read_only=True)

    class Meta:
        model = Term
        fields = ["id", "session", "session_name", "name", "start_date", "end_date", "is_current"]


class ClassLevelSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    class_teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = ClassLevel
        fields = ["id", "name", "section", "order", "student_count", "class_teacher_name"]

    def get_student_count(self, obj):
        return obj.students.filter(status="active").count()

    def get_class_teacher_name(self, obj):
        teacher = getattr(obj, "class_teacher", None)
        return teacher.full_name if teacher else None


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "section", "code"]


class GuardianSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = Guardian
        fields = [
            "id", "first_name", "last_name", "full_name", "relationship",
            "phone", "email", "occupation", "address", "children_count", "created_at",
        ]

    def get_children_count(self, obj):
        return obj.children.count()


class TeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    class_teacher_of_name = serializers.CharField(source="class_teacher_of.name", read_only=True)
    subjects_detail = SubjectSerializer(source="subjects", many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = [
            "id", "staff_id", "first_name", "last_name", "full_name",
            "email", "phone", "qualification", "photo", "hire_date", "is_active",
            "class_teacher_of", "class_teacher_of_name",
            "subjects", "subjects_detail", "classes", "created_at",
        ]
        read_only_fields = ("staff_id",)

    def to_representation(self, instance):
        # Swap the raw MEDIA path for a signed, time-limited link on the way
        # out; the underlying field stays a normal writable ImageField for
        # uploads (create/update untouched).
        data = super().to_representation(instance)
        if instance.photo:
            data["photo"] = build_secure_url(self.context.get("request"), instance.photo)
        return data


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    class_name = serializers.CharField(source="class_level.name", read_only=True)
    class_section = serializers.CharField(source="class_level.section", read_only=True)
    guardian_name = serializers.SerializerMethodField()
    guardian_phone = serializers.CharField(source="guardian.phone", read_only=True)
    session_name = serializers.CharField(source="current_session.name", read_only=True)
    has_safety_notes = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id", "admission_no", "first_name", "last_name", "full_name",
            "date_of_birth", "gender", "photo",
            "class_level", "class_name", "class_section",
            "current_session", "session_name",
            "guardian", "guardian_name", "guardian_phone",
            "allergies", "medical_notes", "dietary_notes", "has_safety_notes",
            "status", "enrollment_date", "source_admission", "created_at",
        ]
        read_only_fields = ("admission_no",)

    def get_guardian_name(self, obj):
        return obj.guardian.full_name if obj.guardian else None

    def get_has_safety_notes(self, obj):
        # Tiny convenience flag for UIs that just want to show a "has notes" pill.
        return bool(obj.allergies.strip() or obj.medical_notes.strip() or obj.dietary_notes.strip())

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.photo:
            data["photo"] = build_secure_url(self.context.get("request"), instance.photo)
        return data


class PickupAuthorizationSerializer(serializers.ModelSerializer):
    student_name      = serializers.CharField(source="student.full_name", read_only=True)
    student_class     = serializers.CharField(source="student.class_level.name", read_only=True)
    relationship_label = serializers.CharField(source="get_relationship_display", read_only=True)
    valid_today       = serializers.SerializerMethodField()

    class Meta:
        model = PickupAuthorization
        fields = [
            "id", "student", "student_name", "student_class",
            "name", "relationship", "relationship_label",
            "phone", "photo", "id_note",
            "valid_from", "valid_until", "is_active",
            "note", "valid_today", "added_by", "created_at",
        ]
        read_only_fields = ("added_by",)

    def get_valid_today(self, obj):
        return obj.is_valid_today()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.photo:
            data["photo"] = build_secure_url(self.context.get("request"), instance.photo)
        return data

    def get_photo(self, obj):
        return build_secure_url(self.context.get("request"), obj.photo)


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    class_name = serializers.CharField(source="class_level.name", read_only=True)
    marked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            "id", "student", "student_name", "admission_no",
            "class_level", "class_name", "date", "status", "note",
            "marked_by", "marked_by_name", "marked_at",
        ]

    def get_marked_by_name(self, obj):
        return obj.marked_by.full_name if obj.marked_by else None


class BasicGradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    term_label = serializers.SerializerMethodField()

    class Meta:
        model = BasicGrade
        fields = [
            "id", "student", "student_name", "admission_no",
            "subject", "subject_name", "term", "term_label",
            "ca1", "ca2", "exam", "total", "grade", "remark",
            "teacher", "updated_at",
        ]
        read_only_fields = ("total", "grade", "updated_at")

    def get_term_label(self, obj):
        return f"{obj.term.name} — {obj.term.session.name}"


class NurseryAssessmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    domain_display = serializers.CharField(source="get_domain_display", read_only=True)
    rating_display = serializers.CharField(source="get_rating_display", read_only=True)
    term_label = serializers.SerializerMethodField()

    class Meta:
        model = NurseryAssessment
        fields = [
            "id", "student", "student_name", "admission_no",
            "term", "term_label",
            "domain", "domain_display",
            "rating", "rating_display", "remark",
            "teacher", "updated_at",
        ]

    def get_term_label(self, obj):
        return f"{obj.term.name} — {obj.term.session.name}"


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    class_name = serializers.CharField(source="class_level.name", read_only=True)
    session_name = serializers.CharField(source="session.name", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id", "student", "student_name",
            "class_level", "class_name",
            "session", "session_name",
            "status", "enrolled_on", "note",
        ]
