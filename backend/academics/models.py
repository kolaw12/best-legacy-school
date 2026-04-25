"""
Academic domain models for Best Legacy Divine School.

Only Nursery 1, Nursery 2, Basic 1..Basic 6 are recognised.
Do NOT introduce secondary-school levels.
"""
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


# ---------------------------------------------------------------------------
# Canonical class levels (seed-only; use DB-backed ClassLevel for FKs)
# ---------------------------------------------------------------------------
SECTION_NURSERY = "nursery"
SECTION_BASIC = "basic"
SECTION_CHOICES = [
    (SECTION_NURSERY, "Nursery"),
    (SECTION_BASIC, "Basic"),
]

CANONICAL_LEVELS = [
    ("Nursery 1", SECTION_NURSERY, 1),
    ("Nursery 2", SECTION_NURSERY, 2),
    ("Basic 1", SECTION_BASIC, 3),
    ("Basic 2", SECTION_BASIC, 4),
    ("Basic 3", SECTION_BASIC, 5),
    ("Basic 4", SECTION_BASIC, 6),
    ("Basic 5", SECTION_BASIC, 7),
    ("Basic 6", SECTION_BASIC, 8),
]
ALLOWED_LEVEL_NAMES = [n for n, _, _ in CANONICAL_LEVELS]


# ---------------------------------------------------------------------------
# Time
# ---------------------------------------------------------------------------
class Session(models.Model):
    """Academic session e.g. 2026/2027."""
    name = models.CharField(max_length=20, unique=True, help_text="e.g. 2026/2027")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_current:
            Session.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class Term(models.Model):
    FIRST, SECOND, THIRD = "First", "Second", "Third"
    TERM_CHOICES = [(FIRST, "First Term"), (SECOND, "Second Term"), (THIRD, "Third Term")]

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="terms")
    name = models.CharField(max_length=10, choices=TERM_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        unique_together = [("session", "name")]
        ordering = ["session__start_date", "start_date"]

    def __str__(self):
        return f"{self.name} Term — {self.session.name}"

    def save(self, *args, **kwargs):
        if self.is_current:
            Term.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Academic structure
# ---------------------------------------------------------------------------
class ClassLevel(models.Model):
    """One of the 8 allowed class levels. Seeded once; never add JSS/SSS."""
    name = models.CharField(max_length=20, unique=True)
    section = models.CharField(max_length=10, choices=SECTION_CHOICES)
    order = models.PositiveSmallIntegerField(unique=True, help_text="1..8 for display order")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name

    def clean(self):
        if self.name not in ALLOWED_LEVEL_NAMES:
            raise ValidationError(
                f"'{self.name}' is not a recognised class level. "
                f"Allowed: {', '.join(ALLOWED_LEVEL_NAMES)}"
            )

    @property
    def is_nursery(self):
        return self.section == SECTION_NURSERY


class Subject(models.Model):
    name = models.CharField(max_length=100)
    section = models.CharField(max_length=10, choices=SECTION_CHOICES)
    code = models.CharField(max_length=20, blank=True, help_text="Short code e.g. ENG, MTH")

    class Meta:
        unique_together = [("name", "section")]
        ordering = ["section", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_section_display()})"


# ---------------------------------------------------------------------------
# People
# ---------------------------------------------------------------------------
class Guardian(models.Model):
    RELATIONSHIP_CHOICES = [
        ("father", "Father"),
        ("mother", "Mother"),
        ("guardian", "Guardian"),
        ("other", "Other"),
    ]
    first_name = models.CharField(max_length=60)
    last_name = models.CharField(max_length=60)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES, default="guardian")
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Teacher(models.Model):
    staff_id = models.CharField(max_length=20, unique=True, blank=True)
    first_name = models.CharField(max_length=60)
    last_name = models.CharField(max_length=60)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    qualification = models.CharField(max_length=200, blank=True)
    photo = models.ImageField(upload_to="staff/", blank=True, null=True)
    hire_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class_teacher_of = models.OneToOneField(
        ClassLevel, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="class_teacher",
        help_text="Assign this teacher as the class teacher of a level",
    )
    subjects = models.ManyToManyField(Subject, blank=True, related_name="teachers")
    classes = models.ManyToManyField(
        ClassLevel, blank=True, related_name="subject_teachers",
        help_text="Class levels this teacher teaches (beyond being class teacher)",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        if not self.staff_id:
            self.staff_id = self._generate_staff_id()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_staff_id():
        year = timezone.now().year
        prefix = f"BLS/T/{year}/"
        last = (
            Teacher.objects.filter(staff_id__startswith=prefix)
            .order_by("-staff_id").first()
        )
        next_num = 1
        if last and last.staff_id:
            try:
                next_num = int(last.staff_id.split("/")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"{prefix}{next_num:03d}"


class Student(models.Model):
    GENDER_CHOICES = [("M", "Male"), ("F", "Female")]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("graduated", "Graduated"),
        ("withdrawn", "Withdrawn"),
        ("suspended", "Suspended"),
    ]

    admission_no = models.CharField(max_length=20, unique=True, blank=True)
    first_name = models.CharField(max_length=60)
    last_name = models.CharField(max_length=60)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    photo = models.ImageField(upload_to="students/", blank=True, null=True)

    class_level = models.ForeignKey(
        ClassLevel, on_delete=models.PROTECT, related_name="students"
    )
    current_session = models.ForeignKey(
        Session, on_delete=models.PROTECT, related_name="active_students", null=True, blank=True
    )
    guardian = models.ForeignKey(
        Guardian, on_delete=models.SET_NULL, null=True, blank=True, related_name="children"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    enrollment_date = models.DateField(default=timezone.now)

    # --- Health, dietary & pickup info -------------------------------------
    # Plain text fields rather than structured allergens because every school
    # phrases these differently. The kitchen + nurse + class teacher all see
    # the same string.
    allergies      = models.TextField(blank=True, help_text="e.g. 'Peanuts (severe), shellfish'")
    medical_notes  = models.TextField(blank=True, help_text="Asthma, on-going medication, etc.")
    dietary_notes  = models.TextField(blank=True, help_text="Vegetarian, halal, lactose intolerant…")

    # Optional link back to the admission application they came from
    source_admission = models.ForeignKey(
        "core.Admission", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="enrolled_students",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["class_level__order", "last_name", "first_name"]

    def __str__(self):
        return f"{self.admission_no} — {self.full_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        if not self.admission_no:
            self.admission_no = self._generate_admission_no()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_admission_no():
        year = timezone.now().year
        prefix = f"BLS/S/{year}/"
        last = (
            Student.objects.filter(admission_no__startswith=prefix)
            .order_by("-admission_no").first()
        )
        next_num = 1
        if last and last.admission_no:
            try:
                next_num = int(last.admission_no.split("/")[-1]) + 1
            except (ValueError, IndexError):
                pass
        return f"{prefix}{next_num:04d}"


class AttendanceRecord(models.Model):
    """One row per student per day. Unique together enforces 'mark once per day'."""
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent",  "Absent"),
        ("late",    "Late"),
        ("excused", "Excused"),
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendance")
    class_level = models.ForeignKey(ClassLevel, on_delete=models.PROTECT, related_name="attendance")
    date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="present")
    note = models.CharField(max_length=200, blank=True)
    marked_by = models.ForeignKey(
        Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="attendance_marked"
    )
    marked_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "date")]
        ordering = ["-date", "class_level__order", "student__last_name"]

    def __str__(self):
        return f"{self.student.full_name} · {self.date} · {self.status}"


class BasicGrade(models.Model):
    """One subject grade per student per term. Totals and letter grade are auto-computed."""
    GRADE_SCALE = [
        ("A", 75), ("B", 65), ("C", 50), ("D", 40), ("E", 30), ("F", 0),
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="basic_grades")
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="grades")
    term    = models.ForeignKey(Term, on_delete=models.PROTECT, related_name="basic_grades")
    ca1  = models.PositiveSmallIntegerField(default=0, help_text="0–20")
    ca2  = models.PositiveSmallIntegerField(default=0, help_text="0–20")
    exam = models.PositiveSmallIntegerField(default=0, help_text="0–60")
    total = models.PositiveSmallIntegerField(default=0)
    grade = models.CharField(max_length=2, blank=True)
    remark = models.CharField(max_length=100, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="grades_entered")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "subject", "term")]
        ordering = ["student__last_name", "subject__name"]

    def __str__(self):
        return f"{self.student.full_name} · {self.subject.name} · {self.term}: {self.total}"

    def save(self, *args, **kwargs):
        # Clamp inputs to valid bounds
        self.ca1 = min(max(int(self.ca1 or 0), 0), 20)
        self.ca2 = min(max(int(self.ca2 or 0), 0), 20)
        self.exam = min(max(int(self.exam or 0), 0), 60)
        self.total = self.ca1 + self.ca2 + self.exam
        for letter, threshold in self.GRADE_SCALE:
            if self.total >= threshold:
                self.grade = letter
                break
        remark_map = {
            "A": "Excellent", "B": "Very Good", "C": "Good",
            "D": "Fair", "E": "Pass", "F": "Needs Improvement",
        }
        if not self.remark:
            self.remark = remark_map.get(self.grade, "")
        super().save(*args, **kwargs)


class NurseryAssessment(models.Model):
    """Developmental-domain rating for nursery pupils, per term."""
    DOMAIN_CHOICES = [
        ("literacy",      "Literacy Readiness"),
        ("numeracy",      "Numeracy Readiness"),
        ("social",        "Social Development"),
        ("emotional",     "Emotional Development"),
        ("motor",         "Motor Skills"),
        ("creative",      "Creative Arts"),
        ("participation", "Class Participation"),
        ("behavior",      "Behaviour"),
    ]
    RATING_CHOICES = [
        ("E",  "Excellent"),
        ("VG", "Very Good"),
        ("G",  "Good"),
        ("F",  "Fair"),
        ("NI", "Needs Improvement"),
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="nursery_assessments")
    term    = models.ForeignKey(Term, on_delete=models.PROTECT, related_name="nursery_assessments")
    domain  = models.CharField(max_length=20, choices=DOMAIN_CHOICES)
    rating  = models.CharField(max_length=3, choices=RATING_CHOICES, default="G")
    remark  = models.CharField(max_length=200, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="assessments_entered")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "term", "domain")]
        ordering = ["student__last_name", "domain"]

    def __str__(self):
        return f"{self.student.full_name} · {self.get_domain_display()}: {self.rating}"


class Enrollment(models.Model):
    """Historical record of a student's placement per session."""
    STATUS_CHOICES = [
        ("active", "Active"),
        ("promoted", "Promoted"),
        ("repeated", "Repeated"),
        ("withdrawn", "Withdrawn"),
    ]
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="enrollments")
    class_level = models.ForeignKey(ClassLevel, on_delete=models.PROTECT, related_name="enrollments")
    session = models.ForeignKey(Session, on_delete=models.PROTECT, related_name="enrollments")
    enrolled_on = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = [("student", "session")]
        ordering = ["-session__start_date"]

    def __str__(self):
        return f"{self.student} · {self.class_level} · {self.session}"


class PickupAuthorization(models.Model):
    """Who is authorised to collect a child from the school gate.

    `valid_from` / `valid_until` allow one-day or one-week passes (e.g. "Aunty
    is collecting Tomi every day next week while mum is away"); leave blank
    for an ongoing authorisation. Gate staff use the daily printable view
    that filters by today's date.
    """
    RELATIONSHIP_CHOICES = [
        ("parent",       "Parent"),
        ("guardian",     "Guardian"),
        ("relative",     "Relative"),
        ("driver",       "Driver"),
        ("nanny",        "Nanny / minder"),
        ("family_friend", "Family friend"),
        ("other",        "Other"),
    ]
    student      = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="pickup_auths")
    name         = models.CharField(max_length=120)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES, default="parent")
    phone        = models.CharField(max_length=20, blank=True)
    photo        = models.ImageField(upload_to="pickup-auths/", blank=True, null=True)
    id_note      = models.CharField(max_length=120, blank=True, help_text="e.g. 'NIN ending 4823' or 'driver's licence on file'")
    valid_from   = models.DateField(null=True, blank=True, help_text="Leave blank for an ongoing pass")
    valid_until  = models.DateField(null=True, blank=True, help_text="Leave blank for an ongoing pass")
    is_active    = models.BooleanField(default=True)
    note         = models.CharField(max_length=200, blank=True)
    added_by     = models.ForeignKey(
        "auth.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="pickup_auths_added",
    )
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["student__last_name", "name"]

    def __str__(self):
        return f"{self.name} → {self.student.full_name}"

    def is_valid_today(self):
        from datetime import date
        today = date.today()
        if not self.is_active:
            return False
        if self.valid_from and self.valid_from > today:
            return False
        if self.valid_until and self.valid_until < today:
            return False
        return True
