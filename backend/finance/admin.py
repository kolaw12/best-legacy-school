from django.contrib import admin
from .models import FeeSchedule, Invoice, Payment, PaymentPlan, PaymentPlanInstalment


@admin.register(FeeSchedule)
class FeeScheduleAdmin(admin.ModelAdmin):
    list_display = ("name", "class_level", "term", "amount", "is_mandatory")
    list_filter = ("class_level__section", "term", "is_mandatory")
    search_fields = ("name",)
    autocomplete_fields = ("class_level", "term")


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ("receipt_no", "created_at")


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_no", "student", "fee_schedule", "amount_due", "amount_paid", "status", "issued_on")
    list_filter = ("status", "term", "fee_schedule__class_level")
    search_fields = ("invoice_no", "student__first_name", "student__last_name", "student__admission_no")
    readonly_fields = ("invoice_no", "amount_paid", "status", "created_at")
    autocomplete_fields = ("student", "fee_schedule", "term")
    inlines = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("receipt_no", "invoice", "amount", "method", "received_on")
    list_filter = ("method", "received_on")
    search_fields = ("receipt_no", "invoice__invoice_no", "reference")
    readonly_fields = ("receipt_no", "created_at")
    autocomplete_fields = ("invoice",)


class PaymentPlanInstalmentInline(admin.TabularInline):
    model = PaymentPlanInstalment
    extra = 0


@admin.register(PaymentPlan)
class PaymentPlanAdmin(admin.ModelAdmin):
    list_display = ("invoice", "instalments", "status", "created_at")
    list_filter = ("status",)
    autocomplete_fields = ("invoice",)
    inlines = [PaymentPlanInstalmentInline]


@admin.register(PaymentPlanInstalment)
class PaymentPlanInstalmentAdmin(admin.ModelAdmin):
    list_display = ("plan", "sequence", "amount", "due_on", "paid_amount", "paid_on")
    list_filter = ("due_on",)
