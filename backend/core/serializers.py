from rest_framework import serializers
from .secure_media import build_secure_url
from .models import (
    Event, GalleryImage, Inquiry, Admission, StudentResult,
    TourBooking, ApplicationStage,
)

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = '__all__'

class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = '__all__'

class AdmissionSerializer(serializers.ModelSerializer):
    # Whether this admission already has a Student enrolled against it — the
    # admissions list needs this on every load, not just right after clicking
    # "Enrol as Student", otherwise a page refresh makes an enrolled row look
    # un-enrolled again and invites a duplicate-enrollment attempt.
    enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Admission
        fields = '__all__'
        # is_deleted/deleted_at must only change via the destroy/restore/purge
        # actions (admin-gated, consistent stamping) — never a plain PATCH,
        # which any staff role (not just admin) can otherwise reach here.
        read_only_fields = ['student_id', 'created_at', 'is_deleted', 'deleted_at']

    def get_enrolled(self, obj):
        return obj.enrolled_students.exists()

    def to_representation(self, instance):
        # Passport photos are safeguarding data for a not-yet-enrolled child —
        # never expose the raw /media/ path, only a signed, expiring link.
        data = super().to_representation(instance)
        if instance.passport_photo:
            data['passport_photo'] = build_secure_url(self.context.get('request'), instance.passport_photo)
        return data

class StudentResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentResult
        fields = '__all__'


class TourBookingSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = TourBooking
        fields = ["id", "parent_name", "parent_phone", "parent_email",
                  "children_count", "interest_class",
                  "requested_date", "requested_slot",
                  "status", "status_label", "note",
                  "confirmed_at", "created_at"]
        read_only_fields = ("status", "confirmed_at")


class ApplicationStageSerializer(serializers.ModelSerializer):
    stage_label = serializers.CharField(source="get_stage_display", read_only=True)

    class Meta:
        model = ApplicationStage
        fields = ["id", "admission", "stage", "stage_label", "note", "happened_at"]
