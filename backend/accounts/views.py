from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from django.contrib.auth.models import User
from django.utils import timezone
import threading

from .models import (
    UserProfile, Role, AuditLog, Announcement, AnnouncementRead,
    MessageThread, Message, MessageRead, Invitation,
)
from .permissions import IsAdmin
from .throttles import LoginRateThrottle
from .serializers import (
    LoginSerializer, UserProfileSerializer, AuditLogSerializer, AnnouncementSerializer,
    MessageThreadSerializer, MessageSerializer,
)
from rest_framework import viewsets, filters


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    serializer = LoginSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]

    # Ensure the user has a profile. Superusers default to school_admin.
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={"role": Role.SCHOOL_ADMIN if user.is_superuser else Role.STUDENT},
    )
    if user.is_superuser and profile.role not in {Role.SUPER_ADMIN, Role.SCHOOL_ADMIN}:
        profile.role = Role.SUPER_ADMIN
        profile.save(update_fields=["role"])

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "profile": UserProfileSerializer(profile).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"ok": True})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me_view(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={"role": Role.SCHOOL_ADMIN if request.user.is_superuser else Role.STUDENT},
    )

    if request.method == "PATCH":
        data = request.data
        user = request.user

        # Update User fields
        for field in ("first_name", "last_name", "email"):
            if field in data:
                setattr(user, field, data[field])
        user.save(update_fields=["first_name", "last_name", "email"])

        # Handle password change
        new_password = data.get("new_password")
        if new_password:
            current_password = data.get("current_password")
            if current_password and not user.check_password(current_password):
                return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save(update_fields=["password"])

        # Update UserProfile fields
        for field in ("phone",):
            if field in data:
                setattr(profile, field, data[field])

        # Handle photo upload
        if "photo" in request.FILES:
            profile.photo = request.FILES["photo"]

        profile.save(update_fields=["phone", "photo"])

    return Response(UserProfileSerializer(profile).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_children(request):
    """Return the Students linked to the current parent via their guardian FK."""
    from academics.models import Student
    from academics.serializers import StudentSerializer

    profile = getattr(request.user, "profile", None)
    if not profile or not profile.guardian_id:
        return Response([], status=200)

    children = Student.objects.filter(
        guardian_id=profile.guardian_id, status="active"
    ).select_related("class_level", "guardian", "current_session")
    return Response(StudentSerializer(children, many=True).data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get("action"):      qs = qs.filter(action=p["action"])
        if p.get("object_type"): qs = qs.filter(object_type=p["object_type"])
        if p.get("user"):        qs = qs.filter(user__username=p["user"])
        return qs[:300]  # hard cap — this is a dashboard, not a data export


# ----- Announcements --------------------------------------------------------
def _audience_for_role(role):
    """Map a profile role to which audience tags it can see."""
    from .models import ADMIN_ROLES
    tags = {"all"}
    if role in ADMIN_ROLES:        tags |= {"admins"}
    if role == Role.TEACHER:       tags |= {"teachers"}
    if role == Role.PARENT:        tags |= {"parents"}
    return tags


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    GET — every signed-in user sees announcements targeted at them
    POST/PATCH/DELETE — admins only
    POST /:id/dismiss/ — current user marks as read
    GET /unread-count/ — small payload for the bell badge
    """
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "body"]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "dismiss", "unread_count"):
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        from django.db.models import Q
        now = timezone.now()
        qs = Announcement.objects.filter(
            (Q(starts_at__isnull=True)  | Q(starts_at__lte=now)) &
            (Q(expires_at__isnull=True) | Q(expires_at__gte=now))
        ).select_related("created_by")

        role = getattr(getattr(self.request.user, "profile", None), "role", None)
        if role:  # signed-in but not admin → filter by audience
            from .models import ADMIN_ROLES
            if role not in ADMIN_ROLES:
                tags = _audience_for_role(role)
                qs = qs.filter(audience__in=tags)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def dismiss(self, request, pk=None):
        ann = self.get_object()
        AnnouncementRead.objects.get_or_create(user=request.user, announcement=ann)
        return Response({"ok": True})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        # Same audience filter as list()
        qs = self.get_queryset()
        unread = qs.exclude(reads__user=request.user).count()
        return Response({"unread": unread})


# ===== Direct messaging =====================================================
class MessageThreadViewSet(viewsets.ModelViewSet):
    """A user only sees threads they participate in.
    Admins see all (for moderation)."""
    serializer_class = MessageThreadSerializer
    permission_classes = [IsAuthenticated]
    queryset = MessageThread.objects.prefetch_related("participants", "messages").all()

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        prof = getattr(user, "profile", None)
        is_admin = prof and prof.role in (Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
        if is_admin:
            return qs
        return qs.filter(participants=user).distinct()

    def perform_create(self, serializer):
        thread = serializer.save(created_by=self.request.user)
        # Always include the creator as a participant.
        thread.participants.add(self.request.user)

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages_endpoint(self, request, pk=None):
        thread = self.get_object()
        if thread not in self.get_queryset():
            return Response({"error": "Not in this thread."}, status=403)

        if request.method == "GET":
            # Mark as read on open
            MessageRead.objects.update_or_create(user=request.user, thread=thread)
            msgs = thread.messages.select_related("author").all()
            return Response(MessageSerializer(msgs, many=True).data)

        # POST a new message
        body = request.data.get("body", "").strip()
        if not body and not request.FILES.get("attachment"):
            return Response({"error": "Empty message."}, status=400)
        msg = Message.objects.create(
            thread=thread, author=request.user, body=body,
            attachment=request.FILES.get("attachment"),
        )
        # Mark sender as up-to-date
        MessageRead.objects.update_or_create(user=request.user, thread=thread)
        return Response(MessageSerializer(msg).data, status=201)

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count_threads(self, request):
        qs = self.get_queryset()
        total = 0
        for t in qs:
            marker = t.reads.filter(user=request.user).first()
            msgs = t.messages.exclude(author=request.user)
            if marker:
                msgs = msgs.filter(sent_at__gt=marker.last_read_at)
            total += msgs.count()
        return Response({"unread": total})


@api_view(["POST"])
@permission_classes([IsAdmin])
def reset_user_password(request, user_id):
    """Admin endpoint: generate a new random password for any User and return it."""
    from .provisioning import _generate_password

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    new_password = _generate_password()
    user.set_password(new_password)
    user.save(update_fields=["password"])

    return Response({
        "username": user.username,
        "password": new_password,
    })


@api_view(["POST"])
@permission_classes([IsAdmin])
def reset_guardian_password(request, guardian_id):
    """Admin endpoint: reset password for a guardian's portal account. If no
    account exists, optionally create one with the provided password."""
    from .provisioning import _generate_password, _unique_username

    try:
        from academics.models import Guardian
        guardian = Guardian.objects.get(pk=guardian_id)
    except Guardian.DoesNotExist:
        return Response({"error": "Guardian not found."}, status=status.HTTP_404_NOT_FOUND)

    # Find existing user linked to this guardian
    profile = UserProfile.objects.filter(guardian=guardian, role=Role.PARENT).select_related("user").first()

    temp_password = (request.data.get("password") or "").strip()

    if profile:
        # Reset existing password
        new_password = temp_password or _generate_password()
        profile.user.set_password(new_password)
        profile.user.save(update_fields=["password"])
        return Response({
            "username": profile.user.username,
            "password": new_password,
        })
    else:
        # No account yet — create one
        if not temp_password:
            return Response({"error": "No portal account exists for this guardian. Provide a password to create one."}, status=status.HTTP_400_BAD_REQUEST)

        username = _unique_username(guardian.phone or guardian.first_name.lower())
        user = User.objects.create_user(
            username=username,
            email=guardian.email or "",
            password=temp_password,
            first_name=guardian.first_name,
            last_name=guardian.last_name,
        )
        UserProfile.objects.create(
            user=user, role=Role.PARENT, guardian=guardian,
        )
        return Response({
            "username": username,
            "password": temp_password,
            "created": True,
        }, status=status.HTTP_201_CREATED)


# ===== Invitation flow ======================================================

def _send_invite_email(email, first_name, token):
    """Fire-and-forget invite email. Same pattern as provisioning._send_credentials_email."""
    from django.conf import settings

    def send():
        invite_url = f"{settings.FRONTEND_URL}/accept-invite?token={token}"
        subject = "You're invited to Best Legacy Divine School portal"
        message = (
            f"Hello {first_name or 'there'},\n\n"
            f"You've been invited to create an account on the Best Legacy "
            f"Divine School portal.\n\n"
            f"Click the link below to set your password:\n\n"
            f"{invite_url}\n\n"
            f"This link expires in 7 days.\n\n"
            f"— Best Legacy Divine School"
        )
        try:
            send_mail(subject, message, settings.EMAIL_HOST_USER, [email], fail_silently=False)
        except Exception as e:  # noqa: BLE001
            print(f"ERROR: Failed to send invite email to {email}: {e}")

    threading.Thread(target=send).start()


@api_view(["POST"])
@permission_classes([IsAdmin])
def send_invite(request):
    """Create an Invitation record and email the link to the recipient.

    Request body:
        email (required)
        role (required): teacher | student | parent | accountant | content_manager
        first_name, last_name (optional)
        teacher_id, student_id, guardian_id (optional): link to an existing record

    Returns the invitation detail (including the token URL) so the admin can
    copy/share it manually if the email doesn't land.
    """
    email = request.data.get("email", "").strip()
    role = request.data.get("role", "").strip()

    if not email:
        return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not role:
        return Response({"error": "Role is required."}, status=status.HTTP_400_BAD_REQUEST)
    if role not in dict(Invitation.ROLE_CHOICES):
        return Response({"error": f"Invalid role. Choose from: {', '.join(dict(Invitation.ROLE_CHOICES).keys())}"},
                        status=status.HTTP_400_BAD_REQUEST)

    # Check for a recent pending invite for the same email+role
    recent_cutoff = timezone.now() - timezone.timedelta(hours=1)
    existing = Invitation.objects.filter(
        email=email, role=role, accepted_at__isnull=True, created_at__gte=recent_cutoff,
    ).first()
    if existing:
        return Response(
            {"error": "A pending invite was already sent to this email less than an hour ago."},
            status=status.HTTP_409_CONFLICT,
        )

    token = Invitation.generate_token()
    invitation = Invitation.objects.create(
        email=email,
        role=role,
        token=token,
        first_name=request.data.get("first_name", ""),
        last_name=request.data.get("last_name", ""),
        teacher_id=request.data.get("teacher_id"),
        student_id=request.data.get("student_id"),
        guardian_id=request.data.get("guardian_id"),
        created_by=request.user,
        expires_at=timezone.now() + timezone.timedelta(days=7),
    )

    _send_invite_email(email, invitation.first_name, token)

    from django.conf import settings
    invite_url = f"{settings.FRONTEND_URL}/accept-invite?token={token}"

    return Response({
        "id": invitation.id,
        "email": invitation.email,
        "role": invitation.role,
        "invite_url": invite_url,
        "expires_at": invitation.expires_at,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def accept_invite_preview(request):
    """Validate a token and return basic info (role, email, name) so the
    accept-invite form can display context. Does NOT reveal whether the
    token has already been accepted — that's handled on submit."""
    token = request.query_params.get("token", "")
    if not token:
        return Response({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        invitation = Invitation.objects.get(token=token)
    except Invitation.DoesNotExist:
        return Response({"error": "Invalid or expired invitation link."}, status=status.HTTP_404_NOT_FOUND)

    if invitation.accepted_at:
        return Response({"error": "This invitation has already been accepted."}, status=status.HTTP_410_GONE)

    if invitation.is_expired:
        return Response({"error": "This invitation has expired. Please ask for a new one."}, status=status.HTTP_410_GONE)

    return Response({
        "email": invitation.email,
        "role": invitation.get_role_display(),
        "first_name": invitation.first_name,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def accept_invite(request):
    """Set a password from an invite link. Creates the User + UserProfile.

    Request body:
        token (required)
        password (required)
    """
    token = request.data.get("token", "")
    password = request.data.get("password", "")

    if not token or not password:
        return Response({"error": "Token and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        invitation = Invitation.objects.get(token=token)
    except Invitation.DoesNotExist:
        return Response({"error": "Invalid invitation link."}, status=status.HTTP_404_NOT_FOUND)

    if invitation.accepted_at:
        return Response({"error": "This invitation has already been accepted."}, status=status.HTTP_410_GONE)

    if invitation.is_expired:
        return Response({"error": "This invitation has expired."}, status=status.HTTP_410_GONE)

    # Validate password against Django's validators
    from django.contrib.auth.password_validation import validate_password
    try:
        validate_password(password)
    except Exception as e:
        return Response({"error": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    # Determine the role for the UserProfile
    role_map = {
        "teacher": Role.TEACHER,
        "student": Role.STUDENT,
        "parent": Role.PARENT,
        "accountant": Role.ACCOUNTANT,
        "content_manager": Role.CONTENT_MANAGER,
    }
    profile_role = role_map.get(invitation.role, Role.STUDENT)

    # provision_login() already created the User (no usable password) and
    # UserProfile when the teacher/guardian was added. Find them and set the
    # password on the existing user instead of creating duplicates.
    # Prefer the user that already has a profile (the provisioned one).
    existing_users = list(User.objects.filter(email=invitation.email).order_by("id"))
    user = None
    if existing_users:
        # Pick the one with a profile if any, else the first
        for u in existing_users:
            if UserProfile.objects.filter(user=u).exists():
                user = u
                break
        if user is None:
            user = existing_users[0]

    if user:
        user.set_password(password)
        user.first_name = invitation.first_name or user.first_name
        user.last_name = invitation.last_name or user.last_name
        user.save()
        username = user.username

        # Update existing profile — provision_login already linked teacher/guardian
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                "role": profile_role,
                "teacher": invitation.teacher,
                "student": invitation.student,
                "guardian": invitation.guardian,
            },
        )
        if not created:
            profile.role = profile_role
            profile.save(update_fields=["role"])
    else:
        # Fallback: no pre-provisioned user (e.g. direct invite without provisioning)
        username = invitation.email
        n = 1
        while User.objects.filter(username=username).exists():
            n += 1
            username = f"{invitation.email}{n}"

        user = User.objects.create_user(
            username=username,
            email=invitation.email,
            password=password,
            first_name=invitation.first_name or "",
            last_name=invitation.last_name or "",
        )
        UserProfile.objects.create(
            user=user,
            role=profile_role,
            teacher=invitation.teacher,
            student=invitation.student,
            guardian=invitation.guardian,
        )

    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["accepted_at"])

    return Response({
        "message": "Account created successfully. You can now log in.",
        "username": username,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def send_sms_view(request):
    """Send SMS to one or more guardians. Accepts:
      - phone: str (single recipient)
      - phones: list[str] (bulk)
      - message: str (required)
    Returns per-recipient results."""
    from .sms import send_sms, send_bulk

    message = (request.data.get("message") or "").strip()
    if not message:
        return Response({"error": "Message is required."}, status=400)

    phone = request.data.get("phone")
    phones = request.data.get("phones") or []

    if phone:
        phones = [phone]

    if not phones:
        return Response({"error": "At least one recipient phone number is required."}, status=400)

    results = send_bulk(phones, message)
    sent = sum(1 for r in results if r.get("ok"))
    return Response({"sent": sent, "total": len(results), "results": results})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def global_search(request):
    """Search across students, teachers, and guardians. Returns top results per category."""
    from django.db.models import Q
    from academics.models import Student, Teacher, Guardian

    q = (request.query_params.get("q") or "").strip()
    if len(q) < 2:
        return Response([])

    role = _role(request)
    results = []

    # Students
    student_qs = Student.objects.filter(
        Q(full_name__icontains=q) | Q(admission_no__icontains=q)
    ).select_related("class_level", "guardian")[:5]
    for s in student_qs:
        results.append({
            "type": "student",
            "id": s.id,
            "title": s.full_name,
            "subtitle": f"{s.admission_no} · {s.class_level.name}",
            "url": f"/admin/students/{s.id}",
        })

    # Teachers
    teacher_qs = Teacher.objects.filter(
        Q(first_name__icontains=q) | Q(last_name__icontains=q)
    ).select_related("class_teacher_of")[:5]
    for t in teacher_qs:
        results.append({
            "type": "teacher",
            "id": t.id,
            "title": t.full_name,
            "subtitle": t.class_teacher_of.name if t.class_teacher_of else "Teacher",
            "url": "/admin/teachers",
        })

    # Guardians
    guardian_qs = Guardian.objects.filter(
        Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(phone__icontains=q)
    )[:5]
    for g in guardian_qs:
        results.append({
            "type": "guardian",
            "id": g.id,
            "title": g.full_name,
            "subtitle": g.phone or "No phone",
            "url": "/admin/guardians",
        })

    return Response(results)


@api_view(["POST"])
@permission_classes([AllowAny])
def setup_admin(request):
    """One-time setup: create or reset the admin user. Call from browser."""
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@bestlegacy.sch',
            'first_name': 'School',
            'last_name': 'Admin',
            'is_staff': True,
        },
    )
    admin_user.set_password('admin123')
    admin_user.save(update_fields=['password'])

    profile, _ = UserProfile.objects.get_or_create(
        user=admin_user,
        defaults={'role': Role.SCHOOL_ADMIN},
    )
    if profile.role != Role.SCHOOL_ADMIN:
        profile.role = Role.SCHOOL_ADMIN
        profile.save(update_fields=['role'])

    return Response({
        "message": "Admin user ready",
        "username": "admin",
        "action": "created" if created else "password_reset",
    })
