from datetime import date as date_cls

from django.utils import timezone
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from accounts.permissions import IsAdminOrReadOnly, IsTeacherOrAdmin

from .models import (
    Book, BookLoan, LostFoundItem,
    BusRoute, BusStop, BusRiderAssignment, BusCheckpoint,
    LateCheckout, GeneratorFuelLog, OutageLog,
    Club, ClubBooking, FundraisingCampaign, Donation,
)
from .serializers import (
    BookSerializer, BookLoanSerializer, LostFoundSerializer,
    BusRouteSerializer, BusStopSerializer, BusRiderAssignmentSerializer, BusCheckpointSerializer,
    LateCheckoutSerializer, GeneratorFuelLogSerializer, OutageLogSerializer,
    ClubSerializer, ClubBookingSerializer, FundraisingCampaignSerializer, DonationSerializer,
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


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "author", "isbn"]


class BookLoanViewSet(_ParentScopedMixin, viewsets.ModelViewSet):
    queryset = BookLoan.objects.select_related("book", "student").all()
    serializer_class = BookLoanSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    @action(detail=True, methods=["post"], url_path="return")
    def mark_returned(self, request, pk=None):
        loan = self.get_object()
        loan.returned_on = date_cls.today()
        loan.save(update_fields=["returned_on"])
        return Response(self.get_serializer(loan).data)


class LostFoundViewSet(viewsets.ModelViewSet):
    queryset = LostFoundItem.objects.select_related("class_level", "added_by").all()
    serializer_class = LostFoundSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["description", "found_at", "claimed_by"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("status"): qs = qs.filter(status=params["status"])
        return qs

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user if self.request.user.is_authenticated else None)


class BusRouteViewSet(viewsets.ModelViewSet):
    queryset = BusRoute.objects.prefetch_related("stops").all()
    serializer_class = BusRouteSerializer
    permission_classes = [IsAdminOrReadOnly]


class BusStopViewSet(viewsets.ModelViewSet):
    queryset = BusStop.objects.all()
    serializer_class = BusStopSerializer
    permission_classes = [IsAdminOrReadOnly]


class BusRiderAssignmentViewSet(_ParentScopedMixin, viewsets.ModelViewSet):
    queryset = BusRiderAssignment.objects.select_related("student", "route", "stop").all()
    serializer_class = BusRiderAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]


class BusCheckpointViewSet(viewsets.ModelViewSet):
    queryset = BusCheckpoint.objects.select_related("route", "stop").all()
    serializer_class = BusCheckpointSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("route"): qs = qs.filter(route_id=params["route"])
        if params.get("today"):
            today = date_cls.today()
            qs = qs.filter(pinged_at__date=today)
        return qs

    def perform_create(self, serializer):
        serializer.save(pinged_by=self.request.user if self.request.user.is_authenticated else None)


class LateCheckoutViewSet(_ParentScopedMixin, viewsets.ModelViewSet):
    queryset = LateCheckout.objects.select_related("student", "student__class_level").all()
    serializer_class = LateCheckoutSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("status"): qs = qs.filter(status=params["status"])
        if params.get("today"):
            today = date_cls.today()
            qs = qs.filter(logged_at__date=today)
        return qs

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=["post"], url_path="collect")
    def mark_collected(self, request, pk=None):
        late = self.get_object()
        late.collected_at = timezone.now()
        late.collected_by = request.data.get("collected_by", "")
        late.status = "collected"
        late.save(update_fields=["collected_at", "collected_by", "status"])
        return Response(self.get_serializer(late).data)


class GeneratorFuelLogViewSet(viewsets.ModelViewSet):
    queryset = GeneratorFuelLog.objects.all()
    serializer_class = GeneratorFuelLogSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user if self.request.user.is_authenticated else None)


class OutageLogViewSet(viewsets.ModelViewSet):
    queryset = OutageLog.objects.all()
    serializer_class = OutageLogSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user if self.request.user.is_authenticated else None)


class ClubViewSet(viewsets.ModelViewSet):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [IsAdminOrReadOnly]


class ClubBookingViewSet(_ParentScopedMixin, viewsets.ModelViewSet):
    queryset = ClubBooking.objects.select_related("club", "student").all()
    serializer_class = ClubBookingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(booked_by=self.request.user if self.request.user.is_authenticated else None)


class FundraisingCampaignViewSet(viewsets.ModelViewSet):
    queryset = FundraisingCampaign.objects.all()
    serializer_class = FundraisingCampaignSerializer
    # Public read so the donation page works without login
    permission_classes = [IsAdminOrReadOnly]


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.select_related("campaign").all()
    serializer_class = DonationSerializer
    permission_classes = [IsAdminOrReadOnly]
