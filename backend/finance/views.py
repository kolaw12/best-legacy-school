from datetime import datetime
from decimal import Decimal
from io import BytesIO

from django.db.models import Sum, Count, Q
from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework import viewsets, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import Role
from accounts.permissions import IsAdminOrReadOnly
from academics.models import Student
from rest_framework.permissions import IsAuthenticated


def _profile(request):
    return getattr(getattr(request, "user", None), "profile", None)


def _role(request):
    p = _profile(request)
    return p.role if p else None

from datetime import date as date_cls, timedelta
from .models import FeeSchedule, Invoice, Payment, PaymentPlan, PaymentPlanInstalment
from .serializers import (
    FeeScheduleSerializer, InvoiceSerializer, PaymentSerializer,
    PaymentPlanSerializer,
)


class FeeScheduleViewSet(viewsets.ModelViewSet):
    queryset = FeeSchedule.objects.select_related("class_level", "term", "term__session").all()
    serializer_class = FeeScheduleSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params
        if p.get("class_level"): qs = qs.filter(class_level_id=p["class_level"])
        if p.get("term"):        qs = qs.filter(term_id=p["term"])
        if p.get("section"):     qs = qs.filter(class_level__section=p["section"])
        return qs

    @action(detail=True, methods=["post"], url_path="generate-invoices")
    def generate_invoices(self, request, pk=None):
        """Create one Invoice per active student in this fee's class_level/term."""
        fee = self.get_object()
        students = Student.objects.filter(
            class_level=fee.class_level, status="active",
        )
        created, existing = 0, 0
        for s in students:
            inv, was_created = Invoice.objects.get_or_create(
                student=s, fee_schedule=fee,
                defaults={
                    "term": fee.term,
                    "amount_due": fee.amount,
                },
            )
            if was_created:
                created += 1
            else:
                existing += 1
        return Response({
            "fee": fee.name,
            "class_level": fee.class_level.name,
            "term": fee.term.name,
            "students_in_class": students.count(),
            "invoices_created": created,
            "invoices_already_existed": existing,
        })


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        "student", "student__class_level", "fee_schedule", "term", "term__session"
    ).prefetch_related("payments").all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["invoice_no", "student__first_name", "student__last_name", "student__admission_no"]

    def get_permissions(self):
        # Parents read their own invoices. Writes stay admin.
        if self.action not in ("list", "retrieve"):
            return [IsAdminOrReadOnly()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        if _role(self.request) == Role.PARENT:
            gid = _profile(self.request).guardian_id
            qs = qs.filter(student__guardian_id=gid) if gid else qs.none()

        p = self.request.query_params
        if p.get("status"):      qs = qs.filter(status=p["status"])
        if p.get("class_level"): qs = qs.filter(student__class_level_id=p["class_level"])
        if p.get("term"):        qs = qs.filter(term_id=p["term"])
        if p.get("student"):     qs = qs.filter(student_id=p["student"])
        return qs


class PaymentPlanViewSet(viewsets.ModelViewSet):
    queryset = PaymentPlan.objects.select_related("invoice", "invoice__student").prefetch_related("schedule").all()
    serializer_class = PaymentPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        qs = super().get_queryset()
        if _role(self.request) == Role.PARENT:
            gid = _profile(self.request).guardian_id
            qs = qs.filter(invoice__student__guardian_id=gid) if gid else qs.none()
        if self.request.query_params.get("invoice"):
            qs = qs.filter(invoice_id=self.request.query_params["invoice"])
        return qs

    def perform_create(self, serializer):
        """Create the plan + auto-generate evenly-spaced instalments."""
        plan = serializer.save()
        # Build N equal instalments, due monthly starting today.
        if plan.schedule.exists():
            return
        n = max(1, plan.instalments)
        amount = (plan.invoice.balance or Decimal("0")) / n
        # Round to 2 decimals; absorb the remainder into the last one.
        per = amount.quantize(Decimal("0.01"))
        first_due = date_cls.today() + timedelta(days=14)
        running = Decimal("0")
        for i in range(1, n + 1):
            due = first_due + timedelta(days=30 * (i - 1))
            this_amount = per if i < n else (plan.invoice.balance - running)
            running += this_amount
            PaymentPlanInstalment.objects.create(
                plan=plan, sequence=i, amount=this_amount, due_on=due,
            )


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("invoice", "invoice__student").all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Parents may CREATE (self-reported) and READ their own; admins full CRUD.
        if self.action in ("list", "retrieve", "create"):
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        qs = super().get_queryset()
        if _role(self.request) == Role.PARENT:
            gid = _profile(self.request).guardian_id
            qs = qs.filter(invoice__student__guardian_id=gid) if gid else qs.none()
        return qs

    def perform_create(self, serializer):
        # When a parent self-reports a payment, stamp their name + a clear marker.
        # Mutate validated_data directly so we don't double-pass kwargs to .save().
        if _role(self.request) == Role.PARENT:
            gid = _profile(self.request).guardian_id
            invoice = serializer.validated_data.get("invoice")
            if not invoice or invoice.student.guardian_id != gid:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only record payments for your own children.")
            parent_name = self.request.user.get_full_name() or self.request.user.username
            serializer.validated_data["received_by"] = f"Parent: {parent_name}"
            if not serializer.validated_data.get("note"):
                serializer.validated_data["note"] = "Self-reported by parent — pending admin verification."
        serializer.save()


# ----- Paystack endpoints ---------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def paystack_init(request):
    """
    Body: { "invoice": <id>, "amount": "<naira>" }   (amount optional → uses balance)
    Returns: { authorization_url, access_code, reference }
    Frontend opens authorization_url OR uses Paystack popup with the access_code.
    """
    from . import paystack
    if not paystack.is_configured():
        return Response({"error": "Paystack is not configured on this server. Set PAYSTACK_SECRET_KEY."}, status=503)

    invoice_id = request.data.get("invoice")
    if not invoice_id:
        return Response({"error": "invoice id is required."}, status=400)

    try:
        invoice = Invoice.objects.select_related("student", "student__guardian").get(pk=invoice_id)
    except Invoice.DoesNotExist:
        return Response({"error": "Invoice not found."}, status=404)

    # RLS: parents can only pay their own children's invoices
    if _role(request) == Role.PARENT:
        gid = _profile(request).guardian_id
        if not gid or invoice.student.guardian_id != gid:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only pay your own children's invoices.")

    amount = request.data.get("amount") or invoice.balance
    if not amount or Decimal(str(amount)) <= 0:
        return Response({"error": "amount must be greater than zero."}, status=400)

    email = (
        request.user.email
        or (invoice.student.guardian.email if invoice.student.guardian else "")
        or "noreply@bestlegacy.sch"
    )
    reference = f"BLS-{invoice.invoice_no.replace('/', '-')}-{int(__import__('time').time())}"

    result = paystack.initialize_transaction(
        email=email,
        amount_kobo=paystack.kobo(amount),
        reference=reference,
        callback_url=request.build_absolute_uri(f"/api/finance/paystack/callback/?ref={reference}"),
        metadata={"invoice_id": invoice.id, "invoice_no": invoice.invoice_no, "student": invoice.student.full_name},
    )
    if not result.get("status"):
        return Response({"error": result.get("message", "Paystack init failed."), "raw": result.get("raw")}, status=502)

    data = result.get("data", {})
    return Response({
        "authorization_url": data.get("authorization_url"),
        "access_code":       data.get("access_code"),
        "reference":         data.get("reference") or reference,
        "amount":            str(amount),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def paystack_verify(request):
    """
    Verify a transaction by reference and create a Payment row if successful
    and not already recorded. Frontend calls this after the popup closes.
    """
    from . import paystack
    ref = request.query_params.get("reference") or request.query_params.get("ref")
    if not ref:
        return Response({"error": "reference is required."}, status=400)
    if not paystack.is_configured():
        return Response({"error": "Paystack not configured."}, status=503)

    result = paystack.verify_transaction(ref)
    if not result.get("status"):
        return Response({"error": result.get("message", "Verify failed.")}, status=502)

    data = result.get("data", {})
    if data.get("status") != "success":
        return Response({"verified": False, "paystack_status": data.get("status"), "reference": ref})

    # Idempotent: don't double-record.
    existing = Payment.objects.filter(reference=ref).first()
    if existing:
        return Response({"verified": True, "already_recorded": True, "receipt_no": existing.receipt_no})

    invoice_id = (data.get("metadata") or {}).get("invoice_id")
    if not invoice_id:
        return Response({"error": "Paystack metadata missing invoice_id."}, status=502)

    try:
        invoice = Invoice.objects.get(pk=invoice_id)
    except Invoice.DoesNotExist:
        return Response({"error": "Invoice not found for this transaction."}, status=404)

    amount_naira = Decimal(data.get("amount", 0)) / Decimal(100)  # kobo → NGN
    payment = Payment.objects.create(
        invoice=invoice,
        amount=amount_naira,
        method="card",   # Paystack handles all of card/transfer/USSD; "card" as the canonical online tag
        reference=ref,
        received_by="Paystack (online)",
        note="Verified via Paystack webhook/return.",
    )
    return Response({"verified": True, "receipt_no": payment.receipt_no, "amount": str(amount_naira)})


@api_view(["POST"])
@permission_classes([AllowAny])
def paystack_webhook(request):
    """Paystack-signed webhook. Verifies HMAC then forwards `charge.success` to verify_transaction."""
    from . import paystack
    sig = request.headers.get("X-Paystack-Signature", "")
    if not paystack.webhook_signature_valid(request.body, sig):
        return Response({"error": "Invalid signature."}, status=400)

    payload = request.data or {}
    event = payload.get("event")
    data = payload.get("data") or {}

    if event != "charge.success":
        return Response({"ok": True, "ignored": event})

    ref = data.get("reference")
    if not ref:
        return Response({"ok": True, "no_reference": True})

    if Payment.objects.filter(reference=ref).exists():
        return Response({"ok": True, "already_recorded": True})

    invoice_id = (data.get("metadata") or {}).get("invoice_id")
    if not invoice_id:
        return Response({"ok": True, "no_invoice_metadata": True})

    try:
        invoice = Invoice.objects.get(pk=invoice_id)
    except Invoice.DoesNotExist:
        return Response({"ok": True, "invoice_missing": True})

    amount_naira = Decimal(data.get("amount", 0)) / Decimal(100)
    Payment.objects.create(
        invoice=invoice, amount=amount_naira,
        method="card", reference=ref,
        received_by="Paystack (webhook)",
        note="Auto-recorded from charge.success webhook.",
    )
    return Response({"ok": True, "recorded": True})


def _amount_in_words(n):
    """Tiny number-to-words for receipts (caps at one billion). Pure-python, no deps."""
    n = int(n)
    if n < 0: return f"minus {_amount_in_words(-n)}"
    if n == 0: return "zero"
    units = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
             "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
             "seventeen", "eighteen", "nineteen"]
    tens  = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

    def under_thousand(x):
        if x < 20: return units[x]
        if x < 100:
            return tens[x // 10] + ("" if x % 10 == 0 else f"-{units[x % 10]}")
        rem = x % 100
        return units[x // 100] + " hundred" + (f" and {under_thousand(rem)}" if rem else "")

    parts = []
    for label, scale in (("billion", 1_000_000_000), ("million", 1_000_000), ("thousand", 1_000)):
        if n >= scale:
            parts.append(f"{under_thousand(n // scale)} {label}")
            n %= scale
    if n:
        parts.append(under_thousand(n))
    return " ".join(parts).strip()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payment_receipt_pdf(request, pk):
    """Server-rendered PDF receipt for a single Payment. Honours parent RLS."""
    try:
        payment = Payment.objects.select_related(
            "invoice", "invoice__student", "invoice__student__class_level",
            "invoice__student__guardian", "invoice__term", "invoice__term__session",
            "invoice__fee_schedule",
        ).get(pk=pk)
    except Payment.DoesNotExist:
        return Response({"error": "Payment not found."}, status=404)

    invoice = payment.invoice
    student = invoice.student

    if _role(request) == Role.PARENT:
        gid = _profile(request).guardian_id
        if not gid or student.guardian_id != gid:
            return Response({"error": "You can only view receipts for your own children."}, status=403)

    amount_int = int(payment.amount)
    payload = {
        "payment": {
            "receipt_no": payment.receipt_no,
            "received_on": payment.received_on.strftime("%d %b %Y") if payment.received_on else "",
            "method_label": payment.get_method_display(),
            "reference": payment.reference,
            "received_by": payment.received_by,
            "note": payment.note,
        },
        "student": {
            "full_name": student.full_name,
            "admission_no": student.admission_no,
            "class_name": student.class_level.name if student.class_level else "—",
        },
        "guardian_name": student.guardian.full_name if student.guardian else "",
        "invoice": {
            "invoice_no": invoice.invoice_no,
            "fee_name": invoice.fee_schedule.name,
            "term": f"{invoice.term.name} — {invoice.term.session.name}",
        },
        "amount_str": f"{payment.amount:,.2f}",
        "amount_words": _amount_in_words(amount_int).capitalize(),
        "balance_str": f"{invoice.balance:,.2f}",
        "invoice_status": invoice.get_status_display(),
        "generated_at": datetime.now().strftime("%d %b %Y %H:%M"),
    }

    html = render_to_string("finance/receipt_pdf.html", payload)

    try:
        from xhtml2pdf import pisa
    except ImportError:
        return HttpResponse(html, content_type="text/html")

    buf = BytesIO()
    result = pisa.CreatePDF(src=html, dest=buf, encoding="utf-8")
    if result.err:
        return Response({"error": "PDF generation failed."}, status=500)

    fname = f"BLS-receipt-{payment.receipt_no.replace('/', '-')}.pdf"
    response = HttpResponse(buf.getvalue(), content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{fname}"'
    return response


@api_view(["GET"])
@permission_classes([AllowAny])  # dashboard summary — lock down later
def finance_summary(request):
    totals = Invoice.objects.aggregate(
        due=Sum("amount_due"), paid=Sum("amount_paid"),
    )
    due  = totals["due"]  or Decimal("0")
    paid = totals["paid"] or Decimal("0")

    by_status = Invoice.objects.values("status").annotate(count=Count("id"))
    status_counts = {row["status"]: row["count"] for row in by_status}

    recent = list(
        Payment.objects.order_by("-received_on", "-created_at")[:5]
        .values(
            "id", "receipt_no", "amount", "method", "received_on",
            "invoice__invoice_no", "invoice__student__first_name", "invoice__student__last_name",
        )
    )

    return Response({
        "totals": {
            "due":  str(due),
            "paid": str(paid),
            "outstanding": str(due - paid),
        },
        "invoices": {
            "total": sum(status_counts.values()),
            **status_counts,
        },
        "recent_payments": [{
            "id": r["id"],
            "receipt_no": r["receipt_no"],
            "amount": str(r["amount"]),
            "method": r["method"],
            "received_on": r["received_on"],
            "invoice_no": r["invoice__invoice_no"],
            "student_name": f"{r['invoice__student__first_name']} {r['invoice__student__last_name']}",
        } for r in recent],
    })
