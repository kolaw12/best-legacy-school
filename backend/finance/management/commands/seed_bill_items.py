"""Seed itemized bill breakdowns and book lists from real school documents."""
from django.core.management.base import BaseCommand
from academics.models import ClassLevel
from finance.models import BillItem, BookItem


# Bill items per class level — amounts extracted from paper bills
# KG bill total: ₦82,000 | Primary 1-5 bill total: ₦88,000 | Primary 6 bill total: ₦90,000
BILL_ITEMS = {
    "KG": [
        ("School Fee",            33000),
        ("Stationeries/Note-book", 0),
        ("Development Fee",        1000),
        ("Uniform (2 Types)",     20000),
        ("Sport Wear",             7000),
        ("Examination Levy",       3000),
        ("Thursday Wear",          7000),
        ("Funday Wear",            5000),
        ("Lesson",                 4000),
        ("Xmas Party",             2000),
    ],
    "PRIMARY_LOW": [
        ("School Fee",            39000),
        ("Stationeries/Note-book", 0),
        ("Development Fee",        1000),
        ("Uniform (2 Types)",     20000),
        ("Sport Wear",             7000),
        ("Examination Levy",       3000),
        ("Thursday Wear",          7000),
        ("Funday Wear",            5000),
        ("Lesson",                 4000),
        ("Xmas Party",             2000),
    ],
    "PRIMARY_6": [
        ("School Fee",            39000),
        ("Stationeries/Note-book", 0),
        ("Development Fee",        1000),
        ("Uniform (2 Types)",     20000),
        ("Sport Wear",             7000),
        ("Examination Levy",       3000),
        ("Thursday Wear",          7000),
        ("Funday Wear",            5000),
        ("Lesson",                 6000),
        ("Xmas Party",             2000),
    ],
}

# Book lists
BOOK_LISTS = {
    "nursery": [
        ("Mathematics",      2500, ""),
        ("English",          2500, ""),
        ("Quantitative",     2300, ""),
        ("Verbal",           2300, ""),
        ("Handwriting",      4000, ""),
        ("Drawing",          2500, ""),
        ("Notebook 20pcs",   1200, "@₦600 each"),
        ("Stationery pack (Crayons, Pencils, Eraser, Soap)", 0, "Required — buy separately"),
    ],
    "basic": [
        ("Mathematics",      4000, ""),
        ("English",          4000, ""),
        ("Quantitative",     2300, ""),
        ("Verbal",           2300, ""),
        ("Vocational",       3000, ""),
        ("Puzzle",           2500, ""),
        ("Handwriting",      3500, ""),
        ("Reading Book",     3500, ""),
        ("Notebook 20pcs",   1200, "@₦600 each"),
    ],
}


class Command(BaseCommand):
    help = "Seed bill items and book lists from real school documents"

    def handle(self, *args, **options):
        classes = {cl.name.upper(): cl for cl in ClassLevel.objects.all()}

        # Map class names to bill tiers
        bill_map = {}
        for name, cl in classes.items():
            if "KG" in name or "NURSERY" in name:
                bill_map[cl] = BILL_ITEMS["KG"]
            elif name == "BASIC 6":
                bill_map[cl] = BILL_ITEMS["PRIMARY_6"]
            elif "BASIC" in name:
                bill_map[cl] = BILL_ITEMS["PRIMARY_LOW"]

        created_bi = 0
        for cl, items in bill_map.items():
            for sn, (name, amount) in enumerate(items, 1):
                _, created = BillItem.objects.update_or_create(
                    class_level=cl, name=name,
                    defaults={"amount": amount, "sn": sn, "is_active": True},
                )
                if created:
                    created_bi += 1

        created_bk = 0
        for section, items in BOOK_LISTS.items():
            for sn, (name, price, note) in enumerate(items, 1):
                _, created = BookItem.objects.update_or_create(
                    section=section, name=name,
                    defaults={"price": price, "note": note, "sn": sn, "is_active": True},
                )
                if created:
                    created_bk += 1

        self.stdout.write(self.style.SUCCESS(
            f"Created {created_bi} bill items and {created_bk} book items."
        ))
