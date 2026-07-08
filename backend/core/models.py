from django.db import models

from .soft_delete import SoftDeleteModel

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    image = models.ImageField(upload_to='events/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class GalleryImage(models.Model):
    caption = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to='gallery/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.caption or "Gallery Image"

class Inquiry(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('read', 'Read'),
        ('responded', 'Responded'),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inquiry from {self.name} - {self.subject}"

class Admission(SoftDeleteModel):
    # Student Details
    student_id = models.CharField(max_length=20, blank=True, unique=True, null=True)
    passport_photo = models.ImageField(upload_to='passports/', null=True, blank=True)
    student_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female')])
    class_applying_for = models.CharField(max_length=50)
    previous_school = models.CharField(max_length=200, blank=True, null=True)

    # Parent/Guardian Details
    parent_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField()
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        base_manager_name = "all_objects"

    def __str__(self):
        return f"{self.student_name} - {self.class_applying_for}"

class TourBooking(models.Model):
    """Self-service tour booking from the public Admissions page."""
    STATUS = [
        ("requested", "Requested"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("no_show",   "No-show"),
    ]
    parent_name = models.CharField(max_length=200)
    parent_phone = models.CharField(max_length=20)
    parent_email = models.EmailField(blank=True)
    children_count = models.PositiveIntegerField(default=1)
    interest_class = models.CharField(max_length=50, blank=True,
                                      help_text='e.g. "Nursery 1", "Basic 3"')
    requested_date = models.DateField()
    requested_slot = models.CharField(max_length=20, default="10:00",
                                      help_text='e.g. "10:00" or "14:30"')
    status = models.CharField(max_length=20, choices=STATUS, default="requested")
    note   = models.TextField(blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-requested_date"]

    def __str__(self):
        return f"{self.parent_name} · {self.requested_date} · {self.status}"


class ApplicationStage(models.Model):
    """Tracks where an Admission application is in the funnel.
    Stages: applied → assessed → offered → accepted → enrolled (or rejected/withdrawn)."""
    STAGE = [
        ("applied",   "Applied"),
        ("assessed",  "Assessment scheduled"),
        ("offered",   "Offered place"),
        ("accepted",  "Place accepted"),
        ("rejected",  "Rejected"),
        ("withdrawn", "Withdrawn by family"),
        ("enrolled",  "Enrolled (now a student)"),
    ]
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, related_name="stages")
    stage     = models.CharField(max_length=20, choices=STAGE, default="applied")
    note      = models.CharField(max_length=200, blank=True)
    happened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["happened_at"]

    def __str__(self):
        return f"{self.admission.student_name} · {self.stage}"


class StudentResult(models.Model):
    student_id = models.CharField(max_length=50, help_text="Unique Student ID or Reg Number")
    student_name = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    score = models.IntegerField()
    grade = models.CharField(max_length=2)
    term = models.CharField(max_length=50, default="First Term")
    session = models.CharField(max_length=20, default="2025/2026")
    student_class = models.CharField(max_length=50, default="Nursery 1")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_name} - {self.subject} ({self.score})"
