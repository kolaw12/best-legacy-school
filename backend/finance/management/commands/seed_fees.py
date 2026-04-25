"""
Seed default fee schedules for the current term + generate invoices for all
active students. Idempotent.

Defaults (NGN, per term):
    Nursery 1 / 2        NGN 75,000
    Basic 1 – 3          NGN 95,000
    Basic 4 – 6          NGN115,000

Run:
    python manage.py seed_fees
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction

from academics.models import ClassLevel, Term, Student
from finance.models import FeeSchedule, Invoice


PRICE_BANDS = [
    (["Nursery 1", "Nursery 2"],            Decimal("75000")),
    (["Basic 1", "Basic 2", "Basic 3"],     Decimal("95000")),
    (["Basic 4", "Basic 5", "Basic 6"],     Decimal("115000")),
]


class Command(BaseCommand):
    help = "Seed default fee schedules for the current term and create invoices for active students."

    @transaction.atomic
    def handle(self, *args, **options):
        term = Term.objects.filter(is_current=True).first()
        if not term:
            self.stdout.write(self.style.ERROR("No current term. Run seed_academics first."))
            return

        schedules = []
        for names, amount in PRICE_BANDS:
            for name in names:
                cl = ClassLevel.objects.filter(name=name).first()
                if not cl:
                    continue
                sched, created = FeeSchedule.objects.get_or_create(
                    class_level=cl, term=term, name="Tuition & Books",
                    defaults={"amount": amount, "is_mandatory": True},
                )
                schedules.append(sched)
                verb = "created" if created else "exists"
                self.stdout.write(f"  {cl.name} · NGN{amount:,.0f} — {verb}")

        total_invoices = 0
        for sched in schedules:
            for s in Student.objects.filter(class_level=sched.class_level, status="active"):
                _, created = Invoice.objects.get_or_create(
                    student=s, fee_schedule=sched,
                    defaults={"term": sched.term, "amount_due": sched.amount},
                )
                if created:
                    total_invoices += 1
        self.stdout.write(self.style.SUCCESS(f"Done. {total_invoices} new invoices generated."))
