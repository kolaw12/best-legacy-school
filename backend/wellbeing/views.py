from datetime import date as date_cls, timedelta

from rest_framework import viewsets, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from accounts.permissions import IsAdminOrReadOnly, IsTeacherOrAdmin
from academics.models import Student

from .models import (
    HealthLog, BehaviourEntry, SchoolEvent, SafeguardingIncident,
    DrillLog, MoodPulse, PupilBadge, StaffCertification,
    PolicyAcknowledgement, CurriculumStrand, ReadingLevel, CommentBankEntry,
)
from .serializers import (
    HealthLogSerializer, BehaviourEntrySerializer, SchoolEventSerializer,
    SafeguardingIncidentSerializer, DrillLogSerializer, MoodPulseSerializer,
    PupilBadgeSerializer, StaffCertificationSerializer, PolicyAcknowledgementSerializer,
    CurriculumStrandSerializer, ReadingLevelSerializer, CommentBankEntrySerializer,
)


def _profile(request):
    return getattr(getattr(request, "user", None), "profile", None)


def _role(request):
    p = _profile(request)
    return p.role if p else None


class _ParentScopedMixin:
    student_path = "student"

    def get_queryset(self):
        qs = super().get_queryset()
        if _role(self.request) == Role.PARENT:
            gid = _profile(self.request).guardian_id
            if not gid:
                return qs.none()
            qs = qs.filter(**{f"{self.student_path}__guardian_id": gid})
        if "student" in self.request.query_params:
            qs = qs.filter(**{self.student_path: self.request.query_params["student"]})
        return qs


class HealthLogViewSet(_ParentScopedMixin, viewsets.ModelViewSet):
    queryset = HealthLog.objects.select_related("student", "student__class_level", "nurse").all()
    serializer_class = HealthLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["complaint", "student__first_name", "student__last_name"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(nurse=self.request.user if self.request.user.is_authenticated else None)


class BehaviourEntryViewSet(_ParentScopedMixin, viewsets.ModelViewSet):
    queryset = BehaviourEntry.objects.select_related("student", "student__class_level", "teacher").all()
    serializer_class = BehaviourEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "detail", "student__first_name", "student__last_name"]

    def get_queryset(self):
        qs = super().get_queryset()
        if _role(self.request) == Role.PARENT:
            qs = qs.filter(is_visible_to_parent=True)
        if self.request.query_params.get("kind"):
            qs = qs.filter(kind=self.request.query_params["kind"])
        if self.request.query_params.get("term"):
            qs = qs.filter(term_id=self.request.query_params["term"])
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]


class SchoolEventViewSet(viewsets.ModelViewSet):
    queryset = SchoolEvent.objects.all()
    serializer_class = SchoolEventSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description", "location"]

    def get_queryset(self):
        qs = super().get_queryset().filter(is_published=True)
        params = self.request.query_params
        if params.get("from"):     qs = qs.filter(start_date__gte=params["from"])
        if params.get("to"):       qs = qs.filter(start_date__lte=params["to"])
        if params.get("kind"):     qs = qs.filter(kind=params["kind"])
        if params.get("audience"): qs = qs.filter(audience__in=[params["audience"], "all"])
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class SafeguardingIncidentViewSet(viewsets.ModelViewSet):
    """Visible only to admins + the original filer (DSL workflow)."""
    queryset = SafeguardingIncident.objects.select_related("student", "filed_by", "triaged_by").all()
    serializer_class = SafeguardingIncidentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        role = _role(self.request)
        if role in (Role.SUPER_ADMIN, Role.SCHOOL_ADMIN):
            return qs
        return qs.filter(filed_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(filed_by=self.request.user if self.request.user.is_authenticated else None)


class DrillLogViewSet(viewsets.ModelViewSet):
    queryset = DrillLog.objects.all()
    serializer_class = DrillLogSerializer
    permission_classes = [IsAdminOrReadOnly]


class MoodPulseViewSet(_ParentScopedMixin, viewsets.ModelViewSet):
    queryset = MoodPulse.objects.select_related("student").all()
    serializer_class = MoodPulseSerializer
    permission_classes = [IsAuthenticated]


class PupilBadgeViewSet(_ParentScopedMixin, viewsets.ModelViewSet):
    queryset = PupilBadge.objects.select_related("student").all()
    serializer_class = PupilBadgeSerializer
    permission_classes = [IsAuthenticated]


class StaffCertificationViewSet(viewsets.ModelViewSet):
    queryset = StaffCertification.objects.select_related("user").all()
    serializer_class = StaffCertificationSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=["get"], url_path="expiring")
    def expiring(self, request):
        cutoff = date_cls.today() + timedelta(days=60)
        qs = self.get_queryset().filter(expires_on__isnull=False, expires_on__lte=cutoff)
        return Response(self.get_serializer(qs, many=True).data)


class PolicyAcknowledgementViewSet(viewsets.ModelViewSet):
    queryset = PolicyAcknowledgement.objects.select_related("user").all()
    serializer_class = PolicyAcknowledgementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        ip = self.request.META.get("HTTP_X_FORWARDED_FOR") or self.request.META.get("REMOTE_ADDR", "")
        serializer.save(user=self.request.user, ip=ip[:45])


class CurriculumStrandViewSet(viewsets.ModelViewSet):
    queryset = CurriculumStrand.objects.select_related("class_level", "subject", "term").all()
    serializer_class = CurriculumStrandSerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("class_level"): qs = qs.filter(class_level_id=params["class_level"])
        if params.get("subject"):     qs = qs.filter(subject_id=params["subject"])
        if params.get("term"):        qs = qs.filter(term_id=params["term"])
        return qs


class ReadingLevelViewSet(_ParentScopedMixin, viewsets.ModelViewSet):
    queryset = ReadingLevel.objects.select_related("student", "term", "teacher").all()
    serializer_class = ReadingLevelSerializer
    permission_classes = [IsAuthenticated]


class CommentBankViewSet(viewsets.ModelViewSet):
    queryset = CommentBankEntry.objects.select_related("subject").all()
    serializer_class = CommentBankEntrySerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("band"):    qs = qs.filter(band=params["band"])
        if params.get("subject"): qs = qs.filter(subject_id=params["subject"])
        return qs

    @action(detail=True, methods=["post"], url_path="use")
    def increment_use(self, request, pk=None):
        entry = self.get_object()
        entry.times_used = (entry.times_used or 0) + 1
        entry.save(update_fields=["times_used"])
        return Response({"id": entry.id, "times_used": entry.times_used})


# ----- Cross-cutting endpoints --------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def daily_digest(request):
    """One-line summary per child for today.
    Parents see their own kids; staff see all active students."""
    today = date_cls.today()
    role = _role(request)

    students = Student.objects.filter(status="active").select_related("class_level", "guardian")
    if role == Role.PARENT:
        gid = _profile(request).guardian_id
        students = students.filter(guardian_id=gid) if gid else students.none()

    digest = []
    from academics.models import AttendanceRecord
    from finance.models import Invoice
    for s in students:
        att = AttendanceRecord.objects.filter(student=s, date=today).first()
        att_label = att.get_status_display() if att else "Not yet marked"
        today_merits   = BehaviourEntry.objects.filter(student=s, kind="merit",   created_at__date=today).count()
        today_demerits = BehaviourEntry.objects.filter(student=s, kind="demerit", created_at__date=today).count()
        visits         = HealthLog.objects.filter(student=s, visited_at__date=today).count()
        outstanding    = Invoice.objects.filter(student=s).exclude(status="paid").count()

        bits = [att_label]
        if today_merits:   bits.append(f"+{today_merits} merit")
        if today_demerits: bits.append(f"-{today_demerits} demerit")
        if visits:         bits.append(f"{visits} sickbay visit")
        if outstanding:    bits.append(f"{outstanding} fee outstanding")

        digest.append({
            "student": s.id,
            "student_name": s.full_name,
            "class_name": s.class_level.name if s.class_level else "—",
            "summary": " · ".join(bits),
            "attendance": att_label,
            "merits_today": today_merits,
            "demerits_today": today_demerits,
            "sickbay_visits": visits,
            "outstanding_invoices": outstanding,
        })

    return Response({"date": today, "digest": digest})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def calendar_for_month(request):
    """Calendar payload for a given month. ?year=2026&month=4"""
    try:
        year  = int(request.query_params.get("year")  or date_cls.today().year)
        month = int(request.query_params.get("month") or date_cls.today().month)
    except ValueError:
        return Response({"error": "year/month must be integers."}, status=400)

    from calendar import monthrange
    first = date_cls(year, month, 1)
    last  = date_cls(year, month, monthrange(year, month)[1])

    in_range = SchoolEvent.objects.filter(
        is_published=True, start_date__lte=last
    ).filter(end_date__gte=first) | SchoolEvent.objects.filter(
        is_published=True, start_date__gte=first, start_date__lte=last,
    )
    if _role(request) == Role.PARENT:
        in_range = in_range.filter(audience__in=["all", "parents", "nursery", "basic"])

    events = in_range.distinct().order_by("start_date", "starts_at")
    return Response({
        "year": year, "month": month,
        "events": SchoolEventSerializer(events, many=True).data,
    })
