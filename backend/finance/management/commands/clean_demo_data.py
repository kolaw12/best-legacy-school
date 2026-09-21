"""Remove all demo/test data while preserving structural config.

Keeps: ClassLevel, Session, Term, Subject, FeeSchedule, BillItem, BookItem,
       the main admin user (kolaytee), GalleryImage, and school config.

Removes: Students, Teachers, Guardians, Enrollments, Attendance, Grades,
         Invoices, Payments, Admissions, AuditLogs, Announcements, test users.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from academics.models import (
    Student, Teacher, Guardian, Enrollment, AttendanceRecord,
    BasicGrade, NurseryAssessment, ClassLevel, Session, Term, Subject,
)
from finance.models import Invoice, Payment, FeeSchedule, BillItem, BookItem
from core.models import Admission, GalleryImage, Inquiry
from accounts.models import UserProfile, AuditLog, Invitation, Announcement
from operations.models import Book, BookLoan


class Command(BaseCommand):
    help = "Remove all demo/test data. Preserves structural config (classes, terms, fees, books)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm', action='store_true',
            help='Actually delete data (dry run by default)',
        )

    def handle(self, *args, **options):
        confirm = options['confirm']

        # Users to KEEP (the real admin)
        KEEP_USERS = {'kolaytee', 'admin'}
        keep_user_ids = set(
            User.objects.filter(username__in=KEEP_USERS).values_list('id', flat=True)
        )

        counts = {}

        # --- Delete in dependency order ---

        # 1. Attendance records
        counts['attendance'] = AttendanceRecord.objects.count()
        if confirm:
            AttendanceRecord.objects.all().delete()

        # 2. Grades
        counts['basic_grades'] = BasicGrade.all_objects.count()
        counts['nursery_assessments'] = NurseryAssessment.objects.count()
        if confirm:
            BasicGrade.all_objects.all().delete()
            NurseryAssessment.objects.all().delete()

        # 3. Payments (before invoices)
        counts['payments'] = Payment.objects.count()
        if confirm:
            Payment.objects.all().delete()

        # 4. Invoices
        counts['invoices'] = Invoice.objects.count()
        if confirm:
            Invoice.objects.all().delete()

        # 5. Enrollments
        counts['enrollments'] = Enrollment.objects.count()
        if confirm:
            Enrollment.objects.all().delete()

        # 6. Students
        counts['students'] = Student.all_objects.count()
        if confirm:
            Student.all_objects.all().delete()

        # 7. Guardians
        counts['guardians'] = Guardian.all_objects.count()
        if confirm:
            Guardian.all_objects.all().delete()

        # 8. Teachers (except those linked to kept users)
        counts['teachers'] = Teacher.objects.count()
        if confirm:
            Teacher.objects.all().delete()

        # 9. Admissions
        counts['admissions'] = Admission.objects.count()
        if confirm:
            Admission.objects.all().delete()

        # 10. Audit logs
        counts['audit_logs'] = AuditLog.objects.count()
        if confirm:
            AuditLog.objects.all().delete()

        # 11. Announcements
        counts['announcements'] = Announcement.objects.count()
        if confirm:
            Announcement.objects.all().delete()

        # 12. Invitations
        counts['invitations'] = Invitation.objects.count()
        if confirm:
            Invitation.objects.all().delete()

        # 13. Book loans
        counts['book_loans'] = BookLoan.objects.count()
        if confirm:
            BookLoan.objects.all().delete()

        # 14. Inquiries
        counts['inquiries'] = Inquiry.objects.count()
        if confirm:
            Inquiry.objects.all().delete()

        # 15. Delete test users (keep only admin)
        test_users = User.objects.exclude(id__in=keep_user_ids)
        counts['test_users'] = test_users.count()
        if confirm:
            test_users.delete()

        # --- Summary ---
        self.stdout.write(self.style.WARNING('\n=== DATA TO BE DELETED ==='))
        total = 0
        for key, count in sorted(counts.items()):
            if count > 0:
                self.stdout.write(f'  {key}: {count}')
                total += count
        self.stdout.write(f'\n  TOTAL: {total} records')

        # --- What we keep ---
        self.stdout.write(self.style.SUCCESS('\n=== PRESERVED ==='))
        self.stdout.write(f'  ClassLevel: {ClassLevel.objects.count()}')
        self.stdout.write(f'  Session: {Session.objects.count()}')
        self.stdout.write(f'  Term: {Term.objects.count()}')
        self.stdout.write(f'  Subject: {Subject.objects.count()}')
        self.stdout.write(f'  FeeSchedule: {FeeSchedule.objects.count()}')
        self.stdout.write(f'  BillItem: {BillItem.objects.count()}')
        self.stdout.write(f'  BookItem: {BookItem.objects.count()}')
        self.stdout.write(f'  GalleryImage: {GalleryImage.objects.count()}')
        self.stdout.write(f'  Book (library): {Book.objects.count()}')
        self.stdout.write(f'  Admin users: {User.objects.filter(id__in=keep_user_ids).count()}')

        if not confirm:
            self.stdout.write(self.style.WARNING(
                '\n⚠️  DRY RUN — no data deleted. Run with --confirm to execute.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(f'\n✅ Deleted {total} records. Database is clean.'))
