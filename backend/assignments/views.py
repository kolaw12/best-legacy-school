from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from accounts.permissions import IsTeacherOrAdmin
from academics.models import Student

from .models import Assignment, Submission
from .serializers import AssignmentSerializer, SubmissionSerializer


def _role(request):
    profile = getattr(request.user, "profile", None)
    return profile.role if profile else None


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    Admins + teachers: full CRUD.
    Parents: read-only list scoped to their children's classes.
    """
    queryset = Assignment.objects.select_related("class_level", "subject", "term", "term__session", "teacher").all()
    serializer_class = AssignmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get("class_level"): qs = qs.filter(class_level_id=p["class_level"])
        if p.get("term"):        qs = qs.filter(term_id=p["term"])
        if p.get("subject"):     qs = qs.filter(subject_id=p["subject"])

        role = _role(self.request)

        # Teachers see the class they teach plus their own class
        if role == Role.TEACHER:
            profile = self.request.user.profile
            teacher = profile.teacher
            if teacher:
                class_ids = list(teacher.classes.values_list("id", flat=True))
                if teacher.class_teacher_of_id:
                    class_ids.append(teacher.class_teacher_of_id)
                qs = qs.filter(class_level_id__in=class_ids or [0])
            else:
                qs = qs.none()

        # Parents see their children's class assignments (published only)
        elif role == Role.PARENT:
            guardian_id = getattr(getattr(self.request.user, "profile", None), "guardian_id", None)
            child_classes = Student.objects.filter(guardian_id=guardian_id).values_list("class_level_id", flat=True)
            qs = qs.filter(class_level_id__in=list(child_classes), is_published=True)

        return qs

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        teacher = profile.teacher if profile else None
        serializer.save(teacher=teacher)


class SubmissionViewSet(viewsets.ModelViewSet):
    """
    Teachers + admins: list/grade all submissions for assignments in their scope.
    Parents: only their children's submissions; can create/update (submit on behalf).
    """
    queryset = Submission.objects.select_related(
        "assignment", "assignment__class_level", "assignment__subject",
        "student", "graded_by",
    ).all()
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get("assignment"): qs = qs.filter(assignment_id=p["assignment"])
        if p.get("student"):    qs = qs.filter(student_id=p["student"])

        role = _role(self.request)
        if role == Role.TEACHER:
            profile = self.request.user.profile
            teacher = profile.teacher
            if teacher:
                class_ids = list(teacher.classes.values_list("id", flat=True))
                if teacher.class_teacher_of_id:
                    class_ids.append(teacher.class_teacher_of_id)
                qs = qs.filter(assignment__class_level_id__in=class_ids or [0])
            else:
                qs = qs.none()
        elif role == Role.PARENT:
            guardian_id = getattr(getattr(self.request.user, "profile", None), "guardian_id", None)
            qs = qs.filter(student__guardian_id=guardian_id)
        return qs

    def perform_create(self, serializer):
        role = _role(self.request)
        if role == Role.PARENT:
            # Validate the student belongs to this parent's guardian
            guardian_id = self.request.user.profile.guardian_id
            student = serializer.validated_data.get("student")
            if not student or student.guardian_id != guardian_id:
                raise PermissionError("You can only submit for your own children.")
        serializer.save(status="submitted")

    @action(detail=True, methods=["post"], url_path="grade", permission_classes=[IsTeacherOrAdmin])
    def grade(self, request, pk=None):
        sub = self.get_object()
        score = request.data.get("score")
        feedback = request.data.get("feedback", "")
        if score is None:
            return Response({"error": "score is required"}, status=400)
        try:
            score_int = int(score)
        except (TypeError, ValueError):
            return Response({"error": "score must be a number"}, status=400)
        if score_int < 0 or score_int > sub.assignment.max_score:
            return Response({"error": f"score must be between 0 and {sub.assignment.max_score}"}, status=400)

        profile = getattr(request.user, "profile", None)
        grader = profile.teacher if profile else None
        sub.score = score_int
        sub.feedback = feedback
        sub.status = "graded"
        sub.graded_by = grader
        sub.graded_at = timezone.now()
        sub.save()
        return Response(SubmissionSerializer(sub).data)
