"""
Seed the academic domain with canonical data for Best Legacy Divine School.

Run:
    python manage.py seed_academics
    python manage.py seed_academics --with-samples  # include sample teachers/students

Idempotent — re-running only fills in missing rows; never duplicates.
"""
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction

from academics.models import (
    Session, Term, ClassLevel, Subject,
    Guardian, Teacher, Student, Enrollment,
    CANONICAL_LEVELS, SECTION_NURSERY, SECTION_BASIC,
)


NURSERY_SUBJECTS = [
    ("English / Literacy", "ENG"),
    ("Phonics", "PHO"),
    ("Numeracy", "NUM"),
    ("Basic Science", "BSC"),
    ("Social Habits", "SOC"),
    ("Creative Arts", "CRA"),
    ("Rhymes & Songs", "RYM"),
    ("Reading", "RDG"),
    ("Handwriting Readiness", "HWR"),
    ("Bible Knowledge", "BIB"),
    ("Physical Development", "PHY"),
]

BASIC_SUBJECTS = [
    ("English Language", "ENG"),
    ("Mathematics", "MTH"),
    ("Basic Science & Technology", "BST"),
    ("Social Studies", "SST"),
    ("Civic Education", "CVE"),
    ("Christian Religious Studies", "CRS"),
    ("Computer Studies / ICT", "ICT"),
    ("Yoruba", "YOR"),
    ("Physical & Health Education", "PHE"),
    ("Creative Arts", "CRA"),
    ("Agricultural Science", "AGR"),
    ("Handwriting", "HWR"),
    ("Verbal Reasoning", "VRB"),
    ("Quantitative Reasoning", "QTR"),
]


class Command(BaseCommand):
    help = "Seed Best Legacy Divine School academic data (sessions, terms, classes, subjects)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-samples", action="store_true",
            help="Also create sample teachers, guardians, and students for demo.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self._seed_sessions_and_terms()
        self._seed_class_levels()
        self._seed_subjects()
        if options["with_samples"]:
            self._seed_sample_people()
        self.stdout.write(self.style.SUCCESS("Seed complete."))

    # -- sessions & terms ----------------------------------------------------
    def _seed_sessions_and_terms(self):
        sessions_spec = [
            ("2025/2026", date(2025, 9, 8), date(2026, 7, 24), False),
            ("2026/2027", date(2026, 9, 7), date(2027, 7, 23), True),
        ]
        for name, start, end, current in sessions_spec:
            sess, created = Session.objects.get_or_create(
                name=name,
                defaults={"start_date": start, "end_date": end, "is_current": current},
            )
            msg = "created" if created else "exists"
            self.stdout.write(f"  Session {name}: {msg}")

            # 3 terms per session
            term_specs = [
                ("First",  start, date(start.year, 12, 19), current),
                ("Second", date(start.year + 1, 1, 8),  date(start.year + 1, 4, 10), False),
                ("Third",  date(start.year + 1, 4, 20), end, False),
            ]
            for tname, tstart, tend, is_current_term in term_specs:
                Term.objects.get_or_create(
                    session=sess, name=tname,
                    defaults={"start_date": tstart, "end_date": tend, "is_current": is_current_term},
                )

    # -- class levels --------------------------------------------------------
    def _seed_class_levels(self):
        for name, section, order in CANONICAL_LEVELS:
            _, created = ClassLevel.objects.get_or_create(
                name=name, defaults={"section": section, "order": order},
            )
            self.stdout.write(f"  ClassLevel {name}: {'created' if created else 'exists'}")

    # -- subjects ------------------------------------------------------------
    def _seed_subjects(self):
        for name, code in NURSERY_SUBJECTS:
            Subject.objects.get_or_create(name=name, section=SECTION_NURSERY, defaults={"code": code})
        for name, code in BASIC_SUBJECTS:
            Subject.objects.get_or_create(name=name, section=SECTION_BASIC, defaults={"code": code})
        self.stdout.write(f"  Subjects: {Subject.objects.count()} total")

    # -- sample people -------------------------------------------------------
    def _seed_sample_people(self):
        self.stdout.write("  Creating sample teachers/guardians/students...")
        current_session = Session.objects.filter(is_current=True).first()

        # Teachers — one class teacher per class level + a floating subject teacher
        class_levels = list(ClassLevel.objects.order_by("order"))
        sample_teachers = [
            ("Abigail", "Okafor",  "abigail.okafor@bestlegacy.sch",  "Nursery 1", "NCE Early Years"),
            ("Grace",   "Adeyemi", "grace.adeyemi@bestlegacy.sch",   "Nursery 2", "B.Ed Early Childhood"),
            ("Samuel",  "Bello",   "samuel.bello@bestlegacy.sch",    "Basic 1",   "B.Ed Primary Ed"),
            ("Mary",    "Johnson", "mary.johnson@bestlegacy.sch",    "Basic 2",   "B.Ed English"),
            ("Daniel",  "Eze",     "daniel.eze@bestlegacy.sch",      "Basic 3",   "B.Sc Mathematics, PGDE"),
            ("Esther",  "Akin",    "esther.akin@bestlegacy.sch",     "Basic 4",   "B.Ed Social Studies"),
            ("Joshua",  "Ibrahim", "joshua.ibrahim@bestlegacy.sch",  "Basic 5",   "B.Sc ICT, PGDE"),
            ("Ruth",    "Oladele", "ruth.oladele@bestlegacy.sch",    "Basic 6",   "B.Ed Integrated Science"),
        ]
        for first, last, email, class_name, qual in sample_teachers:
            class_level = next((c for c in class_levels if c.name == class_name), None)
            teacher, created = Teacher.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first, "last_name": last,
                    "qualification": qual, "hire_date": date(2022, 9, 1),
                    "class_teacher_of": class_level,
                },
            )
            if created and class_level:
                # Assign subjects for that section
                section = class_level.section
                teacher.classes.add(class_level)
                teacher.subjects.set(Subject.objects.filter(section=section)[:4])

        # Guardians + students
        sample_students = [
            ("Tomi",    "Adebayo",   "F", date(2021, 4, 12), "Nursery 1", "Kolade", "Adebayo", "mother",   "+2348031112200"),
            ("David",   "Okoro",     "M", date(2020, 7, 3),  "Nursery 2", "Ifeoma", "Okoro",   "mother",   "+2348031112201"),
            ("Amara",   "Nwosu",     "F", date(2019, 1, 22), "Basic 1",   "Chinedu","Nwosu",   "father",   "+2348031112202"),
            ("Samuel",  "Eze",       "M", date(2018, 10, 5), "Basic 2",   "Ngozi",  "Eze",     "mother",   "+2348031112203"),
            ("Ayomide", "Adeleke",   "M", date(2017, 5, 18), "Basic 3",   "Funke",  "Adeleke", "mother",   "+2348031112204"),
            ("Zainab",  "Bello",     "F", date(2016, 8, 9),  "Basic 4",   "Musa",   "Bello",   "father",   "+2348031112205"),
            ("Emmanuel","Ogundele",  "M", date(2015, 3, 27), "Basic 5",   "Biola",  "Ogundele","mother",   "+2348031112206"),
            ("Precious","Olatunji",  "F", date(2014, 12, 14),"Basic 6",   "Segun",  "Olatunji","father",   "+2348031112207"),
        ]
        for first, last, gender, dob, class_name, g_first, g_last, rel, phone in sample_students:
            guardian, _ = Guardian.objects.get_or_create(
                phone=phone,
                defaults={
                    "first_name": g_first, "last_name": g_last,
                    "relationship": rel,
                    "email": f"{g_first.lower()}.{g_last.lower()}@example.com",
                    "address": "Mowe, Ogun State",
                },
            )
            class_level = next((c for c in class_levels if c.name == class_name), None)
            if not class_level:
                continue
            student, created = Student.objects.get_or_create(
                first_name=first, last_name=last, date_of_birth=dob,
                defaults={
                    "gender": gender,
                    "class_level": class_level,
                    "current_session": current_session,
                    "guardian": guardian,
                    "status": "active",
                },
            )
            if created and current_session:
                Enrollment.objects.get_or_create(
                    student=student, session=current_session,
                    defaults={"class_level": class_level, "status": "active"},
                )
        self.stdout.write(
            f"  Sample data: {Teacher.objects.count()} teachers, "
            f"{Student.objects.count()} students, "
            f"{Guardian.objects.count()} guardians."
        )
