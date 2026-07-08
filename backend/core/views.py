from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.core.mail import send_mail
from accounts.permissions import IsAdminOrReadOnly, IsStaff, IsAdmin
from .mixins import SoftDeleteViewSetMixin
from .models import (
    Event, GalleryImage, Inquiry, Admission, StudentResult,
    TourBooking, ApplicationStage,
)
from .serializers import (
    EventSerializer, GalleryImageSerializer, InquirySerializer,
    AdmissionSerializer, StudentResultSerializer,
    TourBookingSerializer, ApplicationStageSerializer,
)

class EventViewSet(viewsets.ModelViewSet):
    """Public site calendar — reads are open, writes are admin-only."""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]

class GalleryImageViewSet(viewsets.ModelViewSet):
    """Public gallery — reads are open, writes are admin-only."""
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer
    permission_classes = [IsAdminOrReadOnly]

class InquiryViewSet(viewsets.ModelViewSet):
    """Anyone can submit the contact form; only staff can read/manage inquiries."""
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsStaff()]

class AdmissionViewSet(SoftDeleteViewSetMixin, viewsets.ModelViewSet):
    """Anyone can submit an application; only staff can list/review/enroll.
    Applicants track status via the separate, verification-gated
    `application_status` endpoint below — not by reading this viewset."""
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action in ('test_email', 'destroy', 'restore', 'purge'):
            return [IsAdmin()]
        return [IsStaff()]

    def _send_email_async(self, subject, message, recipient_list):
        from django.conf import settings
        import threading
        
        def send():
            try:
                print(f"DEBUG: Attempting to send email to {recipient_list}")
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=recipient_list,
                    fail_silently=False,
                )
                print(f"DEBUG: Email sent successfully to {recipient_list}")
            except Exception as e:
                print(f"ERROR: Failed to send email to {recipient_list}: {str(e)}")
        
        thread = threading.Thread(target=send)
        thread.start()

    def get_queryset(self):
        queryset = Admission.objects.all()
        student_id = self.request.query_params.get('student_id')
        class_name = self.request.query_params.get('class')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if class_name:
            queryset = queryset.filter(class_applying_for=class_name)
        return queryset

    def perform_create(self, serializer):
        # Generate Student ID
        import datetime
        import threading
        from django.conf import settings

        year = datetime.date.today().year
        prefix = f"BLS/{year}/"
        
        # Find the highest sequence number for this year to avoid collisions
        latest_admission = Admission.all_objects.filter(student_id__startswith=prefix).order_by('-student_id').first()
        
        if latest_admission and latest_admission.student_id:
            try:
                # Extract numbers from the current format (e.g., "BLS/2026/003")
                parts = latest_admission.student_id.split('/')
                last_num = int(parts[-1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = Admission.all_objects.filter(created_at__year=year).count() + 1
        else:
            next_num = 1

        generated_id = f"{prefix}{next_num:03d}"
        
        # Double safety: check for collision in case of race conditions
        while Admission.objects.filter(student_id=generated_id).exists():
            next_num += 1
            generated_id = f"{prefix}{next_num:03d}"
        
        instance = serializer.save(student_id=generated_id)
        
        subject = f"Admission Application Received - {instance.student_name}"
        message = f"""Dear {instance.parent_name},

Thank you for applying to Best Legacy Divine School.

We have received the admission application for {instance.student_name}.
Your Student Registration Number (Student ID) is: {generated_id}

Please keep this ID safe as it may be required for checking results later.

Our admissions team will review the details and contact you shortly.

Best regards,
Admissions Team
Best Legacy Divine School"""
        
        self._send_email_async(subject, message, [instance.email])

    def perform_update(self, serializer):
        # Fetch status BEFORE saving to check for changes
        old_status = self.get_object().status
        instance = serializer.save()
        
        if old_status != instance.status:
            subject = ""
            message = ""
            
            if instance.status == 'accepted':
                subject = f"Admission Accepted - {instance.student_name}"
                message = f"""Dear {instance.parent_name},

Congratulations! We are pleased to inform you that {instance.student_name} has been accepted to Best Legacy Divine School.

Student ID: {instance.student_id}
Class: {instance.class_applying_for}

Please visit the school office to complete the registration process.

Best regards,
Admissions Team
Best Legacy Divine School"""
            elif instance.status == 'rejected':
                subject = f"Admission Update - {instance.student_name}"
                message = f"""Dear {instance.parent_name},

Thank you for your interest in Best Legacy Divine School.

After careful review, we regret to inform you that we are unable to offer admission to {instance.student_name} at this time.

We wish you the best in finding the right placement for your child.

Best regards,
Admissions Team
Best Legacy Divine School"""

            if subject and message:
                self._send_email_async(subject, message, [instance.email])

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """
        Convert an accepted Admission into a real Student + Guardian record.
        Idempotent: if a Student already exists for this admission, returns it.
        """
        from academics.models import Student, Guardian, ClassLevel, Session, Enrollment
        from academics.serializers import StudentSerializer

        admission = self.get_object()
        if admission.status != 'accepted':
            return Response(
                {"error": "Only accepted admissions can be enrolled."},
                status=400,
            )

        # Already enrolled? Return the existing student.
        existing = Student.objects.filter(source_admission=admission).first()
        if existing:
            return Response(
                {"detail": "already enrolled", "student": StudentSerializer(existing).data},
                status=200,
            )

        # Resolve class level (must be one of the 8). Matched case/whitespace-
        # insensitively — the admission's class_applying_for is free text and
        # older submissions have been seen stored as "nursery 1" instead of
        # the canonical "Nursery 1", which used to hard-fail enrollment here.
        try:
            class_level = ClassLevel.objects.get(name__iexact=admission.class_applying_for.strip())
        except ClassLevel.DoesNotExist:
            return Response(
                {"error": f"'{admission.class_applying_for}' is not a recognised class level."},
                status=400,
            )

        # Split parent name → guardian first/last (best effort)
        parts = (admission.parent_name or "").strip().split(" ", 1)
        g_first = parts[0] or "Parent"
        g_last = parts[1] if len(parts) > 1 else ""

        guardian, guardian_created = Guardian.objects.get_or_create(
            phone=admission.phone_number,
            defaults={
                "first_name": g_first,
                "last_name": g_last,
                "email": admission.email,
                "address": admission.address,
                "relationship": "guardian",
            },
        )
        if guardian_created and guardian.email:
            from accounts.models import Role
            from accounts.provisioning import provision_login
            provision_login(
                email=guardian.email, first_name=guardian.first_name, last_name=guardian.last_name,
                role=Role.PARENT, guardian=guardian,
            )

        # Split child name
        cparts = (admission.student_name or "").strip().split(" ", 1)
        s_first = cparts[0]
        s_last = cparts[1] if len(cparts) > 1 else ""

        current_session = Session.objects.filter(is_current=True).first()

        student = Student.objects.create(
            first_name=s_first,
            last_name=s_last,
            date_of_birth=admission.date_of_birth,
            gender=admission.gender,
            photo=admission.passport_photo,
            class_level=class_level,
            current_session=current_session,
            guardian=guardian,
            status="active",
            source_admission=admission,
        )
        if current_session:
            Enrollment.objects.get_or_create(
                student=student, session=current_session,
                defaults={"class_level": class_level, "status": "active"},
            )

        return Response(
            {"detail": "enrolled", "student": StudentSerializer(student).data},
            status=201,
        )

    @action(detail=False, methods=['post'])
    def test_email(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=400)
            
        subject = "Test Email - Best Legacy Divine School"
        message = "This is a test email to verify that your school website's email system is working correctly."
        
        self._send_email_async(subject, message, [email])
        return Response({'message': f'Test email triggered for {email}. Please check your inbox (and spam folder) in a few seconds.'})

class StudentResultViewSet(viewsets.ModelViewSet):
    """Staff-only. This is the legacy flat results table, not the RBAC'd
    academics.BasicGrade pipeline — there is no verified public lookup for
    it (unlike admissions' application_status), so it cannot be exposed
    for anonymous reads without leaking any child's grades to anyone who
    guesses a student_id."""
    queryset = StudentResult.objects.all()
    serializer_class = StudentResultSerializer
    permission_classes = [IsStaff]

    def get_queryset(self):
        queryset = StudentResult.objects.all()
        student_id = self.request.query_params.get('student_id')
        term = self.request.query_params.get('term')
        session = self.request.query_params.get('session')
        student_class = self.request.query_params.get('student_class')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if term:
            queryset = queryset.filter(term=term)
        if session:
            queryset = queryset.filter(session=session)
        if student_class:
            queryset = queryset.filter(student_class=student_class)

        return queryset


class TourBookingViewSet(viewsets.ModelViewSet):
    """Public can POST a request; staff (any authenticated user) can list/manage."""
    queryset = TourBooking.objects.all()
    serializer_class = TourBookingSerializer

    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
        from django.utils import timezone
        booking = self.get_object()
        booking.status = "confirmed"
        booking.confirmed_at = timezone.now()
        booking.save(update_fields=["status", "confirmed_at"])
        return Response(self.get_serializer(booking).data)


class ApplicationStageViewSet(viewsets.ModelViewSet):
    queryset = ApplicationStage.objects.all()
    serializer_class = ApplicationStageSerializer
    # Staff-only writes; the public tracker uses a separate read-only endpoint below.
    from rest_framework.permissions import IsAuthenticated as _IsAuthenticated
    permission_classes = [_IsAuthenticated]


@api_view(["GET"])
@permission_classes([AllowAny])
def application_status(request):
    """Public application tracker. Look up by ?ref=<student_id> + ?phone=<last4>.
    Returns the stage history without exposing PII to URL-scrapers."""
    ref = request.query_params.get("ref", "").strip()
    phone_last4 = request.query_params.get("phone", "").strip()[-4:]
    if not ref or not phone_last4:
        return Response({"error": "ref and phone (last 4 digits) required."}, status=400)

    try:
        adm = Admission.objects.prefetch_related("stages").get(student_id=ref)
    except Admission.DoesNotExist:
        return Response({"error": "Application not found."}, status=404)

    if not adm.phone_number.endswith(phone_last4):
        return Response({"error": "Phone number does not match application on file."}, status=403)

    stages = list(adm.stages.order_by("happened_at").values("stage", "note", "happened_at"))
    return Response({
        "ref": adm.student_id,
        "student_name": adm.student_name,
        "class_applying_for": adm.class_applying_for,
        "current_status": adm.status,
        "stages": stages,
    })
