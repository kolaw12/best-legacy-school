"""
Seed demo user accounts for Best Legacy Divine School.

Creates three login-ready users so the admin console works out-of-the-box:
    admin    / admin123    (school admin)
    teacher  / teacher123  (teacher, linked to Basic 3 teacher if present)
    student  / student123  (student, linked to a sample student if present)

Idempotent — existing users are kept but have their role/link refreshed.
"""
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import UserProfile, Role
from academics.models import Teacher, Student, Guardian


DEMO = [
    dict(username="admin",   password="admin123",   email="admin@bestlegacy.sch",
         first_name="School", last_name="Admin",   role=Role.SCHOOL_ADMIN,
         is_staff=True, is_superuser=False),
    dict(username="teacher", password="teacher123", email="daniel.eze@bestlegacy.sch",
         first_name="Daniel", last_name="Eze",     role=Role.TEACHER,
         is_staff=False, is_superuser=False),
    dict(username="student", password="student123", email="ayomide@example.com",
         first_name="Ayomide", last_name="Adeleke", role=Role.STUDENT,
         is_staff=False, is_superuser=False),
    dict(username="parent",  password="parent123",  email="chinedu.nwosu@example.com",
         first_name="Chinedu", last_name="Nwosu",  role=Role.PARENT,
         is_staff=False, is_superuser=False,
         guardian_phone="+2348031112202"),
]


class Command(BaseCommand):
    help = "Create demo users (admin / teacher / student) with UserProfiles."

    @transaction.atomic
    def handle(self, *args, **options):
        for spec in DEMO:
            user, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={
                    "email": spec["email"],
                    "first_name": spec["first_name"],
                    "last_name": spec["last_name"],
                    "is_staff": spec["is_staff"],
                    "is_superuser": spec["is_superuser"],
                },
            )
            if created:
                user.set_password(spec["password"])
                user.save()

            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = spec["role"]

            # Link teacher/student if we can find a match in the academics seed data.
            if spec["role"] == Role.TEACHER:
                profile.teacher = Teacher.objects.filter(email=spec["email"]).first()
            elif spec["role"] == Role.STUDENT:
                profile.student = Student.objects.filter(first_name=spec["first_name"]).first()
            elif spec["role"] == Role.PARENT:
                profile.guardian = Guardian.objects.filter(phone=spec.get("guardian_phone")).first()

            profile.save()
            verb = "created" if created else "updated"
            self.stdout.write(f"  {spec['username']}: {verb} (role={spec['role']})")

        self.stdout.write(self.style.SUCCESS(
            "Demo users ready.\n"
            "  admin   / admin123\n"
            "  teacher / teacher123\n"
            "  student / student123\n"
            "  parent  / parent123\n"
        ))
