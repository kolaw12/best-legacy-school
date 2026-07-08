"""
Unified trash listing across every soft-deletable model. Kept as one plain
view rather than a viewset per model so the admin trash page has a single
place to fetch everything that's been deleted, sorted by when — restoring or
permanently deleting still goes through each model's own
`/<type>s/<id>/restore/` or `/purge/` action (see core.mixins).

Local imports inside trash_list (not at module scope) avoid the same
core <-> academics circular-import trap the `enroll` action already works
around elsewhere in this app.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.permissions import IsAdmin

# type key -> (API base path the frontend calls restore/purge on, label fn, detail fn)
_DESCRIPTORS = {
    "student":   ("/api/academics/students/", lambda o: o.full_name, lambda o: f"{o.class_level.name} · {o.admission_no}"),
    "guardian":  ("/api/academics/guardians/", lambda o: o.full_name, lambda o: f"{o.children.count()} child(ren) · {o.phone}"),
    "teacher":   ("/api/academics/teachers/", lambda o: o.full_name, lambda o: o.staff_id),
    "class":     ("/api/academics/classes/",  lambda o: o.name, lambda o: o.get_section_display()),
    "subject":   ("/api/academics/subjects/", lambda o: o.name, lambda o: o.get_section_display()),
    "admission": ("/api/admissions/",         lambda o: o.student_name, lambda o: f"Applied for {o.class_applying_for}"),
    "grade":     ("/api/academics/grades/",   lambda o: f"{o.student.full_name} — {o.subject.name}", lambda o: f"{o.term} · {o.total}/100"),
    "assessment": ("/api/academics/assessments/", lambda o: f"{o.student.full_name} — {o.get_domain_display()}", lambda o: f"{o.term} · {o.get_rating_display()}"),
    "fee_schedule": ("/api/finance/fees/",    lambda o: o.name, lambda o: f"{o.class_level.name} · ₦{o.amount:,.0f}"),
    "invoice":   ("/api/finance/invoices/",   lambda o: f"{o.invoice_no} — {o.student.full_name}", lambda o: f"₦{o.amount_due:,.0f} due · {o.get_status_display()}"),
    "payment":   ("/api/finance/payments/",   lambda o: f"{o.receipt_no} — {o.invoice.student.full_name}", lambda o: f"₦{o.amount:,.0f} · {o.get_method_display()}"),
}


@api_view(["GET"])
@permission_classes([IsAdmin])
def trash_list(request):
    from academics.models import ClassLevel, Guardian, Student, Subject, Teacher, BasicGrade, NurseryAssessment
    from core.models import Admission
    from finance.models import FeeSchedule, Invoice, Payment

    querysets = {
        "student":   Student.all_objects.dead().select_related("class_level"),
        "guardian":  Guardian.all_objects.dead(),
        "teacher":   Teacher.all_objects.dead(),
        "class":     ClassLevel.all_objects.dead(),
        "subject":   Subject.all_objects.dead(),
        "admission": Admission.all_objects.dead(),
        "grade":     BasicGrade.all_objects.dead().select_related("student", "subject", "term", "term__session"),
        "assessment": NurseryAssessment.all_objects.dead().select_related("student", "term", "term__session"),
        "fee_schedule": FeeSchedule.all_objects.dead().select_related("class_level"),
        "invoice":   Invoice.all_objects.dead().select_related("student"),
        "payment":   Payment.all_objects.dead().select_related("invoice", "invoice__student"),
    }

    rows = []
    for type_key, qs in querysets.items():
        base_path, label_fn, detail_fn = _DESCRIPTORS[type_key]
        for obj in qs:
            rows.append({
                "type": type_key,
                "id": obj.id,
                "label": label_fn(obj),
                "detail": detail_fn(obj),
                "deleted_at": obj.deleted_at,
                "restore_url": f"{base_path}{obj.id}/restore/",
                "purge_url": f"{base_path}{obj.id}/purge/",
            })

    rows.sort(key=lambda r: r["deleted_at"] or "", reverse=True)
    return Response(rows)
