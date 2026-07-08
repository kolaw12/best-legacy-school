from datetime import date as date_cls
from datetime import datetime, timedelta
from io import BytesIO

from django.db.models import Count, Q
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.dateparse import parse_date
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role, ADMIN_ROLES
from accounts.permissions import IsAdminOrReadOnly, IsTeacherOrAdmin, IsStaff
from accounts.provisioning import provision_login
from core.branding import logo_data_uri
from core.mixins import SoftDeleteViewSetMixin, ProvisionCredentialsMixin


def _profile(request):
    return getattr(getattr(request, "user", None), "profile", None)


def _role(request):
    p = _profile(request)
    return p.role if p else None


def _scope_students_queryset(qs, request):
    """Parents see only their children; teachers see their class(es); admins see everything."""
    role = _role(request)
    if role in ADMIN_ROLES:
        return qs
    if role == Role.PARENT:
        gid = _profile(request).guardian_id
        return qs.filter(guardian_id=gid) if gid else qs.none()
    if role == Role.TEACHER:
        teacher = _profile(request).teacher
        if not teacher:
            return qs.none()
        class_ids = list(teacher.classes.values_list("id", flat=True))
        if teacher.class_teacher_of_id:
            class_ids.append(teacher.class_teacher_of_id)
        return qs.filter(class_level_id__in=class_ids or [0])
    # Students / others see nothing sensitive via this endpoint
    return qs.none()


def _teacher_class_ids(request):
    teacher = getattr(_profile(request), "teacher", None)
    if not teacher:
        return []
    ids = list(teacher.classes.values_list("id", flat=True))
    if teacher.class_teacher_of_id:
        ids.append(teacher.class_teacher_of_id)
    return ids
from core.models import Admission
from .models import (
    Session, Term, ClassLevel, Subject,
    Guardian, Teacher, Student, Enrollment, AttendanceRecord,
    BasicGrade, NurseryAssessment, PickupAuthorization,
)
from .serializers import (
    SessionSerializer, TermSerializer, ClassLevelSerializer, SubjectSerializer,
    GuardianSerializer, TeacherSerializer, StudentSerializer, EnrollmentSerializer,
    AttendanceRecordSerializer,
    BasicGradeSerializer, NurseryAssessmentSerializer,
    PickupAuthorizationSerializer,
)


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        # A session is useless without its 3 terms — auto-create First/Second/
        # Third split evenly across the session's date range, rather than
        # making the admin add each one by hand every single year. Dates are
        # just a starting point; edit them individually on the Terms page.
        session = serializer.save()
        span = (session.end_date - session.start_date).days
        third = span // 3
        bounds = [
            session.start_date,
            session.start_date + timedelta(days=third),
            session.start_date + timedelta(days=2 * third + 1),
            session.end_date,
        ]
        for name, start, end in zip(
            [Term.FIRST, Term.SECOND, Term.THIRD],
            bounds[:3],
            [bounds[1] - timedelta(days=1), bounds[2] - timedelta(days=1), bounds[3]],
        ):
            Term.objects.create(session=session, name=name, start_date=start, end_date=end)


class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.select_related("session").all()
    serializer_class = TermSerializer
    filterset_fields = ["session", "name", "is_current"]
    permission_classes = [IsAdminOrReadOnly]


class ClassLevelViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = ClassLevel.objects.all().order_by("order")
    serializer_class = ClassLevelSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "section"]
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        section = self.request.query_params.get("section")
        if section:
            qs = qs.filter(section=section)
        return qs


class SubjectViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "code"]
    permission_classes = [IsAdminOrReadOnly]

    def get_permissions(self):
        # Teachers may add new subjects (they hit this when a subject they
        # need is missing from the dropdown while grading/assigning work),
        # but editing or trashing an *existing* subject — shared across every
        # teacher's dropdowns — stays admin-only.
        if self.action == "create":
            return [IsTeacherOrAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        section = self.request.query_params.get("section")
        if section:
            qs = qs.filter(section=section)
        return qs


class GuardianViewSet(ProvisionCredentialsMixin, SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = Guardian.objects.all()
    serializer_class = GuardianSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name", "phone", "email"]
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        guardian = serializer.save()
        if guardian.email and not guardian.user_profiles.exists():
            self._provisioned = provision_login(
                email=guardian.email, first_name=guardian.first_name, last_name=guardian.last_name,
                role=Role.PARENT, guardian=guardian,
            )

    @action(detail=True, methods=["post", "delete"])
    def purge(self, request, pk=None):
        # Guardian -> Student uses on_delete=SET_NULL, not PROTECT, so a hard
        # delete here wouldn't raise ProtectedError like the other trashable
        # models do — it would silently orphan any remaining children
        # (guardian_id -> NULL) instead. Block it explicitly.
        instance = self._get_any_object(pk)
        if instance.children.exists():
            return Response(
                {"error": f"Can't permanently delete '{instance.full_name}' — {instance.children.count()} child record(s) still point to them. Reassign those pupils to a different guardian first."},
                status=400,
            )
        return super().purge(request, pk=pk)


class TeacherViewSet(ProvisionCredentialsMixin, SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = (
        Teacher.objects
        .select_related("class_teacher_of")
        .prefetch_related("subjects", "classes")
        .all()
    )
    serializer_class = TeacherSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name", "email", "staff_id"]
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        teacher = serializer.save()
        if teacher.email and not hasattr(teacher, "user_profile"):
            self._provisioned = provision_login(
                email=teacher.email, first_name=teacher.first_name, last_name=teacher.last_name,
                role=Role.TEACHER, teacher=teacher,
            )

    def get_queryset(self):
        qs = super().get_queryset()
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        return qs


# ----- Promotion engine -----------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def promote_students(request):
    """End-of-session bulk promotion.

    Body:
        {
          "from_session": <id>,             # session whose pupils are leaving
          "to_session":   <id>,             # session they're moving into
          "actions": [                      # OPTIONAL — overrides per-student
            {"student": <id>, "action": "promote"|"repeat"|"graduate"|"withdraw", "note": "..."}
          ],
          "default_action": "promote"       # OPTIONAL, defaults to "promote"
        }

    Behaviour:
        - "promote"  → moves to next ClassLevel (Basic 6 → graduate)
        - "repeat"   → stays in same ClassLevel
        - "graduate" → status = graduated, no enrollment created
        - "withdraw" → status = withdrawn, no enrollment created
    Each pupil writes one new Enrollment row in the target session and a
    matching close-out row on the previous one.
    """
    role = _role(request)
    if role not in ADMIN_ROLES:
        return Response({"error": "Admin only."}, status=403)

    from_id = request.data.get("from_session")
    to_id   = request.data.get("to_session")
    if not from_id or not to_id:
        return Response({"error": "from_session and to_session are required."}, status=400)

    try:
        from_session = Session.objects.get(pk=from_id)
        to_session   = Session.objects.get(pk=to_id)
    except Session.DoesNotExist:
        return Response({"error": "Invalid session id."}, status=400)

    actions_by_student = {}
    for entry in (request.data.get("actions") or []):
        try:
            actions_by_student[int(entry["student"])] = {
                "action": entry.get("action", "promote"),
                "note":   entry.get("note", ""),
            }
        except (KeyError, ValueError, TypeError):
            continue
    default_action = request.data.get("default_action", "promote")

    levels = list(ClassLevel.objects.order_by("order"))
    next_by_id = {}
    for i, lvl in enumerate(levels):
        next_by_id[lvl.id] = levels[i + 1] if i + 1 < len(levels) else None  # None = past Basic 6

    pupils = Student.objects.filter(status="active").select_related("class_level")
    promoted, repeated, graduated, withdrawn, errors = 0, 0, 0, 0, []

    for s in pupils:
        spec = actions_by_student.get(s.id) or {"action": default_action, "note": ""}
        action_kind = spec["action"]
        note = spec["note"]
        try:
            if action_kind == "graduate" or (action_kind == "promote" and next_by_id[s.class_level_id] is None):
                s.status = "graduated"
                s.save(update_fields=["status"])
                Enrollment.objects.update_or_create(
                    student=s, session=from_session,
                    defaults={"class_level": s.class_level, "status": "promoted",
                              "note": note or "Graduated from Basic 6"},
                )
                graduated += 1
            elif action_kind == "withdraw":
                s.status = "withdrawn"
                s.save(update_fields=["status"])
                Enrollment.objects.update_or_create(
                    student=s, session=from_session,
                    defaults={"class_level": s.class_level, "status": "withdrawn", "note": note},
                )
                withdrawn += 1
            elif action_kind == "repeat":
                Enrollment.objects.update_or_create(
                    student=s, session=from_session,
                    defaults={"class_level": s.class_level, "status": "repeated", "note": note},
                )
                Enrollment.objects.update_or_create(
                    student=s, session=to_session,
                    defaults={"class_level": s.class_level, "status": "active", "note": note},
                )
                s.current_session = to_session
                s.save(update_fields=["current_session"])
                repeated += 1
            else:  # promote
                next_class = next_by_id[s.class_level_id]
                Enrollment.objects.update_or_create(
                    student=s, session=from_session,
                    defaults={"class_level": s.class_level, "status": "promoted", "note": note},
                )
                Enrollment.objects.update_or_create(
                    student=s, session=to_session,
                    defaults={"class_level": next_class, "status": "active", "note": note},
                )
                s.class_level = next_class
                s.current_session = to_session
                s.save(update_fields=["class_level", "current_session"])
                promoted += 1
        except Exception as exc:  # noqa: BLE001
            errors.append({"student": s.id, "name": s.full_name, "error": str(exc)})

    # Mark the new session current.
    Session.objects.exclude(pk=to_session.pk).update(is_current=False)
    to_session.is_current = True
    to_session.save(update_fields=["is_current"])

    return Response({
        "summary": {"promoted": promoted, "repeated": repeated, "graduated": graduated,
                    "withdrawn": withdrawn, "errors": len(errors)},
        "from_session": from_session.name,
        "to_session": to_session.name,
        "errors": errors,
    })


# ----- Bulk CSV student import ---------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def students_bulk_import(request):
    """
    Accepts a CSV file (`file` form field) and creates Student + Guardian rows
    in bulk. Idempotent on (first_name + last_name + date_of_birth) — re-runs
    skip duplicates rather than erroring.

    Required CSV columns:
        first_name, last_name, date_of_birth, gender, class_level

    Optional columns:
        guardian_first_name, guardian_last_name, guardian_phone,
        guardian_email, relationship, address

    Date format: YYYY-MM-DD. Gender: M / F. Class level must match the
    canonical names exactly ("Nursery 1", "Basic 3" etc.).
    """
    role = _role(request)
    if role not in ADMIN_ROLES:
        return Response({"error": "Admin only."}, status=403)

    upload = request.FILES.get("file")
    if not upload:
        return Response({"error": "No file uploaded — attach a CSV under the 'file' field."}, status=400)

    import csv
    import io

    try:
        text = upload.read().decode("utf-8-sig")
    except UnicodeDecodeError:
        return Response({"error": "File must be UTF-8 CSV."}, status=400)

    reader = csv.DictReader(io.StringIO(text))
    required = {"first_name", "last_name", "date_of_birth", "gender", "class_level"}
    if reader.fieldnames is None or not required.issubset({h.strip() for h in reader.fieldnames}):
        return Response({
            "error": f"Missing required columns. Need: {', '.join(sorted(required))}",
            "found": reader.fieldnames or [],
        }, status=400)

    current_session = Session.objects.filter(is_current=True).first()
    class_index = {c.name: c for c in ClassLevel.objects.all()}

    created, skipped, errors = [], [], []

    for row_num, row in enumerate(reader, start=2):  # row 1 is the header
        try:
            row = {k.strip(): (v or "").strip() for k, v in row.items()}
            class_level = class_index.get(row["class_level"])
            if not class_level:
                errors.append({"row": row_num, "error": f"Unknown class_level '{row['class_level']}'"})
                continue
            if row["gender"] not in {"M", "F"}:
                errors.append({"row": row_num, "error": f"Gender must be M or F (got '{row['gender']}')"})
                continue

            # Idempotency: skip if a student with the same name + DOB exists.
            existing = Student.objects.filter(
                first_name__iexact=row["first_name"],
                last_name__iexact=row["last_name"],
                date_of_birth=row["date_of_birth"],
            ).first()
            if existing:
                skipped.append({"row": row_num, "admission_no": existing.admission_no})
                continue

            guardian = None
            g_phone = row.get("guardian_phone")
            if g_phone:
                guardian, _ = Guardian.objects.get_or_create(
                    phone=g_phone,
                    defaults={
                        "first_name": row.get("guardian_first_name", "Parent"),
                        "last_name":  row.get("guardian_last_name", ""),
                        "email":      row.get("guardian_email", ""),
                        "address":    row.get("address", ""),
                        "relationship": row.get("relationship", "guardian"),
                    },
                )

            student = Student.objects.create(
                first_name=row["first_name"],
                last_name=row["last_name"],
                date_of_birth=row["date_of_birth"],
                gender=row["gender"],
                class_level=class_level,
                current_session=current_session,
                guardian=guardian,
                status="active",
            )
            created.append({
                "row": row_num,
                "admission_no": student.admission_no,
                "name": student.full_name,
                "class": class_level.name,
            })
        except Exception as exc:  # noqa: BLE001 — row-level errors must never abort the batch
            errors.append({"row": row_num, "error": str(exc)})

    return Response({
        "summary": {
            "created":  len(created),
            "skipped":  len(skipped),
            "errors":   len(errors),
        },
        "created": created,
        "skipped": skipped,
        "errors":  errors,
    })


class StudentViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = (
        Student.objects
        .select_related("class_level", "guardian", "current_session")
        .all()
    )
    serializer_class = StudentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["first_name", "last_name", "admission_no", "guardian__last_name"]
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        qs = _scope_students_queryset(qs, self.request)
        params = self.request.query_params
        class_level = params.get("class_level")
        section = params.get("section")
        status_ = params.get("status")
        if class_level:
            qs = qs.filter(class_level_id=class_level)
        if section:
            qs = qs.filter(class_level__section=section)
        if status_:
            qs = qs.filter(status=status_)
        return qs


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related("student", "class_level", "session").all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminOrReadOnly]


class PickupAuthorizationViewSet(viewsets.ModelViewSet):
    """
    Admins: full CRUD across all pupils.
    Parents: CRUD only on their own children's pickup list.
    Teachers + gate staff: read-only across whole school for the daily list.
    """
    queryset = PickupAuthorization.objects.select_related("student", "student__class_level").all()
    serializer_class = PickupAuthorizationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "phone", "student__first_name", "student__last_name", "student__admission_no"]

    def get_queryset(self):
        qs = super().get_queryset()
        role = _role(self.request)
        if role == Role.PARENT:
            gid = _profile(self.request).guardian_id
            qs = qs.filter(student__guardian_id=gid) if gid else qs.none()
        # Optional filters
        p = self.request.query_params
        if p.get("student"):    qs = qs.filter(student_id=p["student"])
        if p.get("active") in ("true", "1"):  qs = qs.filter(is_active=True)
        if p.get("today") in ("true", "1"):
            from datetime import date as _d
            today = _d.today()
            from django.db.models import Q
            qs = qs.filter(is_active=True).filter(
                Q(valid_from__isnull=True) | Q(valid_from__lte=today),
                Q(valid_until__isnull=True) | Q(valid_until__gte=today),
            )
        return qs

    def perform_create(self, serializer):
        # Parent RLS — they may only add an authorisation for their own child.
        role = _role(self.request)
        if role == Role.PARENT:
            student = serializer.validated_data.get("student")
            gid = _profile(self.request).guardian_id
            if not student or student.guardian_id != gid:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only add authorisations for your own children.")
        serializer.save(added_by=self.request.user)


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related("student", "class_level", "marked_by").all()
    serializer_class = AttendanceRecordSerializer

    def get_permissions(self):
        # Parents can read their own children's attendance; writes stay teacher/admin.
        if self.action in ("list", "retrieve"):
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        role = _role(self.request)

        if role == Role.PARENT:
            gid = _profile(self.request).guardian_id
            qs = qs.filter(student__guardian_id=gid) if gid else qs.none()
        elif role == Role.TEACHER:
            qs = qs.filter(class_level_id__in=_teacher_class_ids(self.request) or [0])

        params = self.request.query_params
        class_level = params.get("class_level")
        d = params.get("date")
        student = params.get("student")
        if class_level:
            qs = qs.filter(class_level_id=class_level)
        if d:
            qs = qs.filter(date=d)
        if student:
            qs = qs.filter(student_id=student)
        return qs

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_mark(self, request):
        """
        Body:
        {
          "class_level": 3,
          "date": "2026-04-24",
          "records": [
            { "student": 1, "status": "present", "note": "" },
            { "student": 2, "status": "absent",  "note": "Sick" }
          ]
        }
        Upserts one AttendanceRecord per student per day.
        """
        class_level_id = request.data.get("class_level")
        day = parse_date(request.data.get("date") or "") or date_cls.today()
        records = request.data.get("records") or []

        if not class_level_id:
            return Response({"error": "class_level is required."}, status=400)

        try:
            class_level = ClassLevel.objects.get(pk=class_level_id)
        except ClassLevel.DoesNotExist:
            return Response({"error": "Invalid class_level."}, status=400)

        # Best-effort: resolve the marker from the user profile if available.
        marker = None
        profile = getattr(request.user, "profile", None)
        if profile and profile.teacher:
            marker = profile.teacher

        saved = []
        errors = []
        for r in records:
            student_id = r.get("student")
            if not student_id:
                continue
            try:
                student = Student.objects.get(pk=student_id, class_level=class_level)
            except Student.DoesNotExist:
                errors.append({"student": student_id, "error": "not in this class"})
                continue

            rec, _ = AttendanceRecord.objects.update_or_create(
                student=student, date=day,
                defaults={
                    "class_level": class_level,
                    "status": r.get("status") or "present",
                    "note": r.get("note") or "",
                    "marked_by": marker,
                },
            )
            saved.append(rec)

        return Response({
            "saved": len(saved),
            "errors": errors,
            "date": str(day),
            "class_level": class_level.name,
        }, status=status.HTTP_200_OK)


class BasicGradeViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = BasicGrade.objects.select_related("student", "subject", "term", "term__session", "teacher").all()
    serializer_class = BasicGradeSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        role = _role(self.request)
        if role == Role.PARENT:
            gid = _profile(self.request).guardian_id
            qs = qs.filter(student__guardian_id=gid) if gid else qs.none()
        elif role == Role.TEACHER:
            qs = qs.filter(student__class_level_id__in=_teacher_class_ids(self.request) or [0])

        params = self.request.query_params
        if params.get("student"):     qs = qs.filter(student_id=params["student"])
        if params.get("subject"):     qs = qs.filter(subject_id=params["subject"])
        if params.get("term"):        qs = qs.filter(term_id=params["term"])
        if params.get("class_level"): qs = qs.filter(student__class_level_id=params["class_level"])
        return qs

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_save(self, request):
        """
        Body:
        {
          "subject": 4, "term": 1,
          "rows": [
            { "student": 3, "ca1": 15, "ca2": 18, "exam": 50 },
            ...
          ]
        }
        Upserts one BasicGrade per (student, subject, term).
        """
        subject_id = request.data.get("subject")
        term_id    = request.data.get("term")
        rows       = request.data.get("rows") or []
        if not subject_id or not term_id:
            return Response({"error": "subject and term are required."}, status=400)
        try:
            subject = Subject.objects.get(pk=subject_id)
            term    = Term.objects.get(pk=term_id)
        except (Subject.DoesNotExist, Term.DoesNotExist):
            return Response({"error": "Invalid subject or term."}, status=400)

        marker = None
        profile = getattr(request.user, "profile", None)
        if profile and profile.teacher:
            marker = profile.teacher

        allowed_student_ids = None
        if _role(request) == Role.TEACHER:
            class_ids = _teacher_class_ids(request)
            allowed_student_ids = set(
                Student.objects.filter(class_level_id__in=class_ids or [0]).values_list("id", flat=True)
            )

        saved, errors = 0, []
        for r in rows:
            if allowed_student_ids is not None and r.get("student") not in allowed_student_ids:
                errors.append({"student": r.get("student"), "error": "Student is not in one of your classes."})
                continue
            try:
                # all_objects, not objects: a previously-trashed row for this
                # exact (student, subject, term) still holds the unique slot,
                # so the filtered manager would try to INSERT a duplicate and
                # hit an IntegrityError instead of reviving it.
                BasicGrade.all_objects.update_or_create(
                    student_id=r["student"], subject=subject, term=term,
                    defaults={
                        "ca1":  r.get("ca1", 0),
                        "ca2":  r.get("ca2", 0),
                        "exam": r.get("exam", 0),
                        "remark": r.get("remark", ""),
                        "teacher": marker,
                        "is_deleted": False,
                        "deleted_at": None,
                    },
                )
                saved += 1
            except Exception as exc:  # noqa: BLE001
                errors.append({"student": r.get("student"), "error": str(exc)})
        return Response({"saved": saved, "errors": errors})


class NurseryAssessmentViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    queryset = NurseryAssessment.objects.select_related("student", "term", "term__session").all()
    serializer_class = NurseryAssessmentSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        role = _role(self.request)
        if role == Role.PARENT:
            gid = _profile(self.request).guardian_id
            qs = qs.filter(student__guardian_id=gid) if gid else qs.none()
        elif role == Role.TEACHER:
            qs = qs.filter(student__class_level_id__in=_teacher_class_ids(self.request) or [0])

        params = self.request.query_params
        if params.get("student"):     qs = qs.filter(student_id=params["student"])
        if params.get("term"):        qs = qs.filter(term_id=params["term"])
        if params.get("class_level"): qs = qs.filter(student__class_level_id=params["class_level"])
        return qs

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_save(self, request):
        """
        Body:
        {
          "term": 1, "domain": "literacy",
          "rows": [{ "student": 1, "rating": "VG", "remark": "" }]
        }
        """
        term_id = request.data.get("term")
        domain  = request.data.get("domain")
        rows    = request.data.get("rows") or []
        if not term_id or not domain:
            return Response({"error": "term and domain are required."}, status=400)
        try:
            term = Term.objects.get(pk=term_id)
        except Term.DoesNotExist:
            return Response({"error": "Invalid term."}, status=400)

        marker = None
        profile = getattr(request.user, "profile", None)
        if profile and profile.teacher:
            marker = profile.teacher

        allowed_student_ids = None
        if _role(request) == Role.TEACHER:
            class_ids = _teacher_class_ids(request)
            allowed_student_ids = set(
                Student.objects.filter(class_level_id__in=class_ids or [0]).values_list("id", flat=True)
            )

        saved, errors = 0, []
        for r in rows:
            if allowed_student_ids is not None and r.get("student") not in allowed_student_ids:
                errors.append({"student": r.get("student"), "error": "Student is not in one of your classes."})
                continue
            NurseryAssessment.all_objects.update_or_create(
                student_id=r["student"], term=term, domain=domain,
                defaults={
                    "rating": r.get("rating", "G"),
                    "remark": r.get("remark", ""),
                    "teacher": marker,
                    "is_deleted": False,
                    "deleted_at": None,
                },
            )
            saved += 1
        return Response({"saved": saved, "errors": errors})


# ---------------------------------------------------------------------------
# Report card — all results for a student in a given term.
# ---------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_card(request, student_id):
    term_id = request.query_params.get("term")
    try:
        student = Student.objects.select_related("class_level", "guardian", "current_session").get(pk=student_id)
    except Student.DoesNotExist:
        return Response({"error": "Student not found."}, status=404)

    # RLS: parents only see their own children
    role = _role(request)
    if role == Role.PARENT:
        gid = _profile(request).guardian_id
        if not gid or student.guardian_id != gid:
            return Response({"error": "You can only view your own child's report."}, status=403)

    term = None
    if term_id:
        term = Term.objects.filter(pk=term_id).select_related("session").first()
    if not term:
        term = Term.objects.filter(is_current=True).select_related("session").first()
    if not term:
        return Response({"error": "No current term set."}, status=400)

    return Response(_build_report_card_payload(student, term))


def _build_report_card_payload(student, term):
    """Shared by the JSON endpoint + the PDF renderer."""
    attendance_qs = AttendanceRecord.objects.filter(
        student=student, date__range=[term.start_date, term.end_date]
    )
    attendance_total = attendance_qs.count()
    attendance_present = attendance_qs.filter(status__in=["present", "late"]).count()
    attendance_absent = attendance_qs.filter(status="absent").count()

    # Resumption date: the start of whichever term comes right after this one
    # (may cross into the next session). None if that term hasn't been
    # created yet — the frontend shows "To be announced" in that case.
    next_term = Term.objects.filter(start_date__gt=term.end_date).order_by("start_date").first()

    payload = {
        "student": {
            "id": student.id,
            "admission_no": student.admission_no,
            "full_name": student.full_name,
            "class_name": student.class_level.name,
            "section": student.class_level.section,
            "gender": student.get_gender_display(),
            "date_of_birth": student.date_of_birth,
            "guardian_name": student.guardian.full_name if student.guardian else None,
        },
        "term": {
            "id": term.id, "name": term.name, "session": term.session.name,
            "start_date": term.start_date, "end_date": term.end_date,
        },
        "attendance": {
            "total": attendance_total,
            "present": attendance_present,
            "absent": attendance_absent,
            "rate": round((attendance_present / attendance_total) * 100) if attendance_total else None,
        },
        "resumption_date": next_term.start_date if next_term else None,
        "is_nursery": student.class_level.section == "nursery",
    }
    if student.class_level.section == "basic":
        grades = list(
            BasicGrade.objects.filter(student=student, term=term)
            .select_related("subject").order_by("subject__name")
        )
        payload["grades"] = [{
            "subject": g.subject.name, "ca1": g.ca1, "ca2": g.ca2, "exam": g.exam,
            "total": g.total, "grade": g.grade, "remark": g.remark,
        } for g in grades]
        totals = [g.total for g in grades]
        payload["summary"] = {
            "subjects": len(grades),
            "average": round(sum(totals) / len(totals), 1) if totals else None,
            "overall_total": sum(totals),
        }
    else:
        rows = list(NurseryAssessment.objects.filter(student=student, term=term).order_by("domain"))
        payload["assessments"] = [{
            "domain": r.get_domain_display(),
            "rating": r.rating, "rating_display": r.get_rating_display(),
            "remark": r.remark,
        } for r in rows]
    return payload


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_card_pdf(request, student_id):
    """Server-rendered PDF of the report card.
    Streams an `application/pdf` response with a useful filename.
    Honours the same parent-RLS rules as the JSON endpoint."""
    try:
        student = Student.objects.select_related("class_level", "guardian", "current_session").get(pk=student_id)
    except Student.DoesNotExist:
        return Response({"error": "Student not found."}, status=404)

    role = _role(request)
    if role == Role.PARENT:
        gid = _profile(request).guardian_id
        if not gid or student.guardian_id != gid:
            return Response({"error": "You can only view your own child's report."}, status=403)

    term_id = request.query_params.get("term")
    term = None
    if term_id:
        term = Term.objects.filter(pk=term_id).select_related("session").first()
    if not term:
        term = Term.objects.filter(is_current=True).select_related("session").first()
    if not term:
        return Response({"error": "No current term set."}, status=400)

    payload = _build_report_card_payload(student, term)
    payload["generated_at"] = datetime.now().strftime("%d %b %Y %H:%M")
    payload["logo_data_uri"] = logo_data_uri()

    html = render_to_string("academics/report_card_pdf.html", payload)

    # xhtml2pdf is pure Python, so it works on Windows without GTK. CSS support
    # is limited (no flexbox / grid) — the template is hand-tuned to its rules.
    try:
        from xhtml2pdf import pisa
    except ImportError:
        # Graceful fallback: serve the HTML if xhtml2pdf isn't installed.
        return HttpResponse(html, content_type="text/html")

    buf = BytesIO()
    result = pisa.CreatePDF(src=html, dest=buf, encoding="utf-8")
    if result.err:
        return Response({"error": "PDF generation failed."}, status=500)

    fname = f"BLS-report-{student.admission_no.replace('/', '-')}-{term.name}-{term.session.name.replace('/', '-')}.pdf"
    response = HttpResponse(buf.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{fname}"'
    return response


# ---------------------------------------------------------------------------
# Dashboard summary — single endpoint for the admin KPI cards.
# ---------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsStaff])
def admin_summary(request):
    total_students = Student.objects.filter(status="active").count()
    total_teachers = Teacher.objects.filter(is_active=True).count()
    total_guardians = Guardian.objects.count()

    # Admissions pipeline
    admission_pending = Admission.objects.filter(status="pending").count()
    admission_accepted = Admission.objects.filter(status="accepted").count()
    admission_rejected = Admission.objects.filter(status="rejected").count()

    section_breakdown = (
        Student.objects.filter(status="active")
        .values("class_level__section")
        .annotate(count=Count("id"))
    )
    by_section = {row["class_level__section"]: row["count"] for row in section_breakdown}

    per_class = (
        ClassLevel.objects
        .annotate(count=Count("students", filter=Q(students__status="active")))
        .order_by("order")
        .values("name", "section", "count")
    )

    current_session = Session.objects.filter(is_current=True).first()
    current_term = Term.objects.filter(is_current=True).select_related("session").first()

    gender_split = (
        Student.objects.filter(status="active")
        .values("gender").annotate(count=Count("id"))
    )
    by_gender = {row["gender"]: row["count"] for row in gender_split}

    # Today's attendance rate
    today = date_cls.today()
    today_records = AttendanceRecord.objects.filter(date=today)
    today_present = today_records.filter(status__in=["present", "late"]).count()
    today_total = today_records.count()
    attendance_rate = round((today_present / today_total) * 100) if today_total else None

    recent_admissions = list(
        Admission.objects.order_by("-created_at")[:5].values(
            "id", "student_id", "student_name", "class_applying_for",
            "status", "created_at", "parent_name", "email",
        )
    )

    return Response({
        "kpis": {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_guardians": total_guardians,
            "admission_pending": admission_pending,
            "admission_accepted": admission_accepted,
            "admission_rejected": admission_rejected,
            "attendance_rate_today": attendance_rate,
            "attendance_marked_today": today_total,
        },
        "section_breakdown": {
            "nursery": by_section.get("nursery", 0),
            "basic": by_section.get("basic", 0),
        },
        "gender_split": {
            "male": by_gender.get("M", 0),
            "female": by_gender.get("F", 0),
        },
        "per_class": list(per_class),
        "current_session": current_session.name if current_session else None,
        "current_term": f"{current_term.name} Term" if current_term else None,
        "recent_admissions": recent_admissions,
    })
