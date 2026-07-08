from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from django.utils import timezone

from .models import (
    UserProfile, Role, AuditLog, Announcement, AnnouncementRead,
    MessageThread, Message, MessageRead,
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={"role": Role.SCHOOL_ADMIN if request.user.is_superuser else Role.STUDENT},
    )
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
