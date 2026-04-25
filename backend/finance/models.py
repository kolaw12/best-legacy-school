"""
Fee schedules, invoices, and payments for Best Legacy Divine School.

Money is stored as NGN using Decimal. Invoice status is derived from the
ratio of amount_paid to amount_due.
"""
from decimal import Decimal
from django.db import models
from django.utils import timezone

from academics.models import ClassLevel, Term, Student


class FeeSchedule(models.Model):
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, related_name="fee_schedules")
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name="fee_schedules")
    name = models.CharField(max_length=100, help_text='e.g. "Tuition & Books"')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_mandatory = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("class_level", "term", "name")]
        ordering = ["term__start_date", "class_level__order", "name"]

    def __str__(self):
        return f"{self.class_level.name} · {self.name} · ₦{self.amount:,.0f}"


class Invoice(models.Model):
    STATUS_CHOICES = [
        ("unpaid",    "Unpaid"),
        ("partial",   "Partial"),
        ("paid",      "Paid"),
        ("cancelled", "Cancelled"),
    ]
    invoice_no     = models.CharField(max_length=30, unique=True, blank=True)
    student        = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="invoices")
    fee_schedule   = models.ForeignKey(FeeSchedule, on_delete=models.PROTECT, related_name="invoices")
    term           = models.ForeignKey(Term, on_delete=models.PROTECT, related_name="invoices")
    amount_due     = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid    = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unpaid")
    issued_on      = models.DateField(default=timezone.localdate)
    due_date       = models.DateField(null=True, blank=True)
    note           = models.CharField(max_length=200, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("student", "fee_schedule")]
        ordering = ["-issued_on"]

    def __str__(self):
        return f"{self.invoice_no} · {self.student.full_name}"

    @property
    def balance(self):
        return (self.amount_due or Decimal("0")) - (self.amount_paid or Decimal("0"))

    def save(self, *args, **kwargs):
        if not self.invoice_no:
            year = timezone.now().year
            prefix = f"BLS/INV/{year}/"
            last = Invoice.objects.filter(invoice_no__startswith=prefix).order_by("-invoice_no").first()
            next_num = 1
            if last and last.invoice_no:
                try:
                    next_num = int(last.invoice_no.split("/")[-1]) + 1
                except (ValueError, IndexError):
                    pass
            self.invoice_no = f"{prefix}{next_num:05d}"
        super().save(*args, **kwargs)

    def recompute_status(self):
        if self.status == "cancelled":
            return
        if self.amount_paid >= self.amount_due:
            self.status = "paid"
        elif self.amount_paid > 0:
            self.status = "partial"
        else:
            self.status = "unpaid"


class PaymentPlan(models.Model):
    """Lets a parent split an Invoice into N timed instalments."""
    STATUS = [("active", "Active"), ("completed", "Completed"), ("cancelled", "Cancelled")]
    invoice    = models.OneToOneField(Invoice, on_delete=models.CASCADE, related_name="payment_plan")
    instalments = models.PositiveIntegerField(default=3)
    status     = models.CharField(max_length=20, choices=STATUS, default="active")
    note       = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.invoice.invoice_no} · {self.instalments}× plan"


class PaymentPlanInstalment(models.Model):
    plan       = models.ForeignKey(PaymentPlan, on_delete=models.CASCADE, related_name="schedule")
    sequence   = models.PositiveIntegerField(help_text="1, 2, 3 …")
    amount     = models.DecimalField(max_digits=12, decimal_places=2)
    due_on     = models.DateField()
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    paid_on    = models.DateField(null=True, blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["sequence"]
        unique_together = [("plan", "sequence")]

    def __str__(self):
        return f"{self.plan.invoice.invoice_no} · #{self.sequence} · ₦{self.amount}"


class Payment(models.Model):
    METHOD_CHOICES = [
        ("cash",     "Cash"),
        ("transfer", "Bank Transfer"),
        ("card",     "Card"),
        ("cheque",   "Cheque"),
        ("pos",      "POS"),
    ]
    receipt_no  = models.CharField(max_length=30, unique=True, blank=True)
    invoice     = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    method      = models.CharField(max_length=20, choices=METHOD_CHOICES, default="transfer")
    reference   = models.CharField(max_length=100, blank=True, help_text="Bank ref, transaction id, etc.")
    received_on = models.DateField(default=timezone.localdate)
    received_by = models.CharField(max_length=100, blank=True, help_text="Who recorded this payment")
    note        = models.CharField(max_length=200, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-received_on", "-created_at"]

    def __str__(self):
        return f"{self.receipt_no} · ₦{self.amount:,.0f}"

    def save(self, *args, **kwargs):
        if not self.receipt_no:
            year = timezone.now().year
            prefix = f"BLS/RCP/{year}/"
            last = Payment.objects.filter(receipt_no__startswith=prefix).order_by("-receipt_no").first()
            next_num = 1
            if last and last.receipt_no:
                try:
                    next_num = int(last.receipt_no.split("/")[-1]) + 1
                except (ValueError, IndexError):
                    pass
            self.receipt_no = f"{prefix}{next_num:05d}"
        super().save(*args, **kwargs)

        # Roll up the new total onto the invoice
        inv = self.invoice
        paid = inv.payments.aggregate(s=models.Sum("amount"))["s"] or Decimal("0")
        inv.amount_paid = paid
        inv.recompute_status()
        inv.save(update_fields=["amount_paid", "status"])
