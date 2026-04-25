from rest_framework import serializers
from .models import Assignment, Submission


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    admission_no = serializers.CharField(source="student.admission_no", read_only=True)
    assignment_title = serializers.CharField(source="assignment.title", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id", "assignment", "assignment_title",
            "student", "student_name", "admission_no",
            "text", "attachment", "status",
            "submitted_at", "score", "feedback",
            "graded_by", "graded_at",
        ]
        read_only_fields = ("graded_at",)


class AssignmentSerializer(serializers.ModelSerializer):
    class_name   = serializers.CharField(source="class_level.name", read_only=True)
    section      = serializers.CharField(source="class_level.section", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True, default=None)
    term_label   = serializers.SerializerMethodField()
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True, default=None)
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id", "class_level", "class_name", "section",
            "subject", "subject_name",
            "term", "term_label",
            "teacher", "teacher_name",
            "title", "description", "due_date", "max_score",
            "is_published", "submission_count", "created_at",
        ]

    def get_term_label(self, obj):
        return f"{obj.term.name} — {obj.term.session.name}"

    def get_submission_count(self, obj):
        return obj.submissions.count()
