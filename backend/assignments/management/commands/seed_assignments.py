"""
Seed demo assignments for every class in the current term.
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from academics.models import ClassLevel, Term, Subject, Teacher
from assignments.models import Assignment


SPECS = [
    # (class_name, subject_name_or_None, title, description)
    ("KG 1",       None,                          "Colours worksheet",   "Colour the fruits using the correct colours."),
    ("KG 2",       None,                          "Rhymes practice",      "Recite two rhymes at home and ask a parent to note how well."),
    ("Nursery 1",  None,                          "Letter tracing",       "Trace all 26 letters in your workbook."),
    ("Nursery 2",  None,                          "Counting objects",     "Count and write numbers 1–20."),
    ("Primary 1",  "English Language",            "Alphabet writing",     "Write the lowercase alphabet three times in a notebook."),
    ("Primary 2",  "Mathematics",                 "Addition drill",       "Complete 20 addition sums up to 50."),
    ("Primary 3",  "Social Studies",              "My community essay",   "Write 10 sentences describing your community."),
    ("Primary 4",  "Basic Science & Technology",  "Plants around us",     "List and sketch 5 plants you see at home or school."),
    ("Primary 5",  "English Language",            "Reading comprehension","Read Chapter 3 and answer the 8 questions at the end."),
]


class Command(BaseCommand):
    help = "Create one sample assignment per class in the current term."

    @transaction.atomic
    def handle(self, *args, **options):
        term = Term.objects.filter(is_current=True).first()
        if not term:
            self.stdout.write(self.style.ERROR("No current term. Run seed_academics first."))
            return

        due = timezone.localdate() + timedelta(days=7)
        created = 0

        for class_name, subject_name, title, desc in SPECS:
            cl = ClassLevel.objects.filter(name=class_name).first()
            if not cl:
                continue
            subject = Subject.objects.filter(name=subject_name, section=cl.section).first() if subject_name else None
            teacher = Teacher.objects.filter(class_teacher_of=cl).first()
            _, was_created = Assignment.objects.get_or_create(
                class_level=cl, term=term, title=title,
                defaults={
                    "description": desc,
                    "subject": subject,
                    "teacher": teacher,
                    "due_date": due,
                    "max_score": 100,
                    "is_published": True,
                },
            )
            if was_created:
                created += 1
            self.stdout.write(f"  {class_name} -> {title}: {'created' if was_created else 'exists'}")

        self.stdout.write(self.style.SUCCESS(f"Done. {created} new assignments."))
