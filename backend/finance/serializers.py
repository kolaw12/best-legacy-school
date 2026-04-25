from rest_framework import serializers
from .models import FeeSchedule, Invoice, Payment, PaymentPlan, PaymentPlanInstalment


class FeeScheduleSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="class_level.name", read_only=True)
    section    = serializers.CharField(source="class_level.section", read_only=True)
    term_label = serializers.SerializerMethodField()
    invoice_count = serializers.SerializerMethodField()

    class Meta:
        model = FeeSchedule
        fields = [
            "id", "name", "amount", "is_mandatory",
            "class_level", "class_name", "section",
            "term", "term_label", "invoice_count", "created_at",
        ]

    def get_term_label(self, obj):
        return f"{obj.term.name} — {obj.term.session.name}"

    def get_invoice_count(self, obj):
        return obj.invoices.count()


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "receipt_no", "invoice", "amount", "method",
            "reference", "received_on", "received_by", "note", "created_at",
        ]
        read_only_fields = ("receipt_no",)


class InvoiceSerializer(serializers.ModelSerializer):
    student_name  = serializers.CharField(source="student.full_name", read_only=True)
    admission_no  = serializers.CharField(source="student.admission_no", read_only=True)
    class_name    = serializers.CharField(source="student.class_level.name", read_only=True)
    fee_name      = serializers.CharField(source="fee_schedule.name", read_only=True)
    term_label    = serializers.SerializerMethodField()
    balance       = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    payments      = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "invoice_no", "student", "student_name", "admission_no", "class_name",
            "fee_schedule", "fee_name", "term", "term_label",
            "amount_due", "amount_paid", "balance", "status",
            "issued_on", "due_date", "note", "payments", "created_at",
        ]
        read_only_fields = ("invoice_no", "amount_paid", "status")

    def get_term_label(self, obj):
        return f"{obj.term.name} — {obj.term.session.name}"


class PaymentPlanInstalmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentPlanInstalment
        fields = ["id", "plan", "sequence", "amount", "due_on",
                  "paid_amount", "paid_on", "reminder_sent_at"]


class PaymentPlanSerializer(serializers.ModelSerializer):
    invoice_no   = serializers.CharField(source="invoice.invoice_no", read_only=True)
    student_name = serializers.CharField(source="invoice.student.full_name", read_only=True)
    schedule     = PaymentPlanInstalmentSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = PaymentPlan
        fields = ["id", "invoice", "invoice_no", "student_name",
                  "instalments", "status", "status_label",
                  "schedule", "note", "created_at"]
