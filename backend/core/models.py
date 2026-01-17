from django.db import models

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

class Admission(models.Model):
    # Student Details
    student_id = models.CharField(max_length=20, blank=True, unique=True, null=True)
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

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_name} - {self.class_applying_for}"

class StudentResult(models.Model):
    student_id = models.CharField(max_length=50, help_text="Unique Student ID or Reg Number")
    student_name = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    score = models.IntegerField()
    grade = models.CharField(max_length=2)
    term = models.CharField(max_length=50, default="First Term")
    session = models.CharField(max_length=20, default="2025/2026")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_name} - {self.subject} ({self.score})"
