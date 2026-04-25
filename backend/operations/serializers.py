from rest_framework import serializers
from .models import (
    Book, BookLoan, LostFoundItem,
    BusRoute, BusStop, BusRiderAssignment, BusCheckpoint,
    LateCheckout, GeneratorFuelLog, OutageLog,
    Club, ClubBooking, FundraisingCampaign, Donation,
)


class BookSerializer(serializers.ModelSerializer):
    copies_on_loan   = serializers.IntegerField(read_only=True)
    copies_available = serializers.IntegerField(read_only=True)

    class Meta:
        model = Book
        fields = ["id", "title", "author", "isbn", "section", "copies_total",
                  "copies_on_loan", "copies_available", "cover", "note", "added_at"]


class BookLoanSerializer(serializers.ModelSerializer):
    book_title   = serializers.CharField(source="book.title", read_only=True)
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    is_overdue   = serializers.BooleanField(read_only=True)

    class Meta:
        model = BookLoan
        fields = ["id", "book", "book_title", "student", "student_name",
                  "borrowed_on", "due_on", "returned_on", "fine", "note",
                  "is_overdue", "created_at"]


class LostFoundSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="class_level.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = LostFoundItem
        fields = ["id", "description", "photo", "found_on", "found_at",
                  "class_level", "class_name", "status", "status_label",
                  "claimed_by", "claimed_on", "note", "created_at"]


class BusStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusStop
        fields = ["id", "route", "name", "order", "pickup_time", "dropoff_time"]


class BusRouteSerializer(serializers.ModelSerializer):
    stops = BusStopSerializer(many=True, read_only=True)
    rider_count = serializers.SerializerMethodField()

    class Meta:
        model = BusRoute
        fields = ["id", "name", "driver_name", "driver_phone", "is_active",
                  "note", "stops", "rider_count", "created_at"]

    def get_rider_count(self, obj):
        return obj.riders.count()


class BusRiderAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    route_name   = serializers.CharField(source="route.name", read_only=True)
    stop_name    = serializers.CharField(source="stop.name", read_only=True)

    class Meta:
        model = BusRiderAssignment
        fields = ["id", "student", "student_name", "route", "route_name",
                  "stop", "stop_name", "note", "created_at"]


class BusCheckpointSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source="route.name", read_only=True)
    stop_name  = serializers.CharField(source="stop.name", read_only=True)
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = BusCheckpoint
        fields = ["id", "route", "route_name", "stop", "stop_name",
                  "kind", "kind_label", "pinged_at", "note", "created_at"]


class LateCheckoutSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    class_name   = serializers.CharField(source="student.class_level.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = LateCheckout
        fields = ["id", "student", "student_name", "class_name",
                  "logged_at", "collected_at", "collected_by",
                  "status", "status_label", "guardian_notified", "note", "created_at"]


class GeneratorFuelLogSerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = GeneratorFuelLog
        fields = ["id", "kind", "kind_label", "litres", "cost_naira", "hours_run",
                  "purchased_on", "note", "created_at"]


class OutageLogSerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = OutageLog
        fields = ["id", "kind", "kind_label", "started_at", "ended_at",
                  "duration_minutes", "impact_note", "created_at"]


class ClubSerializer(serializers.ModelSerializer):
    seats_taken = serializers.IntegerField(read_only=True)
    seats_left  = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = ["id", "name", "description", "schedule", "capacity",
                  "fee_naira", "section", "is_active", "seats_taken", "seats_left", "created_at"]

    def get_seats_left(self, obj):
        return max(0, obj.capacity - obj.seats_taken)


class ClubBookingSerializer(serializers.ModelSerializer):
    club_name    = serializers.CharField(source="club.name", read_only=True)
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ClubBooking
        fields = ["id", "club", "club_name", "student", "student_name",
                  "status", "status_label", "booked_on", "note", "created_at"]


class FundraisingCampaignSerializer(serializers.ModelSerializer):
    percent_raised = serializers.IntegerField(read_only=True)

    class Meta:
        model = FundraisingCampaign
        fields = ["id", "title", "blurb", "goal_naira", "raised_naira",
                  "cover", "starts_on", "ends_on", "is_active",
                  "percent_raised", "created_at"]


class DonationSerializer(serializers.ModelSerializer):
    campaign_title = serializers.CharField(source="campaign.title", read_only=True)

    class Meta:
        model = Donation
        fields = ["id", "campaign", "campaign_title", "donor_name", "donor_email",
                  "donor_phone", "amount_naira", "method", "reference",
                  "is_anonymous", "note", "given_on", "created_at"]
