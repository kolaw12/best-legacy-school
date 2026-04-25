"""
Assignments + submissions for Best Legacy Divine School.

An Assignment is created by a Teacher against a class (and optionally a
subject for Basic classes). Each active student in that class can have one
Submission per assignment.
"""
from django.db import models
from django.utils import timezone

from academics.models import ClassLevel, Subject, Term, Student, Teacher


class Assignment(models.Model):
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, related_name="assignments")
    subject     = models.ForeignKey(Subject, on_delete=models.PROTECT, null=True, blank=True,
                                    related_name="assignments",
                                    help_text="Leave blank for nursery developmental work.")
    term        = models.ForeignKey(Term, on_delete=models.PROTECT, related_name="assignments")
    teacher     = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="assignments_set")
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date    = models.DateField(null=True, blank=True)
    max_score   = models.PositiveSmallIntegerField(default=100)
    is_published = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} · {self.class_level.name}"


class Submission(models.Model):
    STATUS_CHOICES = [
        ("draft",     "Draft"),
        ("submitted", "Submitted"),
        ("graded",    "Graded"),
    ]
    assignment  = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student     = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="submissions")
    text        = models.TextField(blank=True)
    attachment  = models.FileField(upload_to="submissions/", blank=True, null=True)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default="submitted")
    submitted_at = models.DateTimeField(default=timezone.now)
    score       = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback    = models.TextField(blank=True)
    graded_by   = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="submissions_graded")
    graded_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [("assignment", "student")]
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student.full_name} · {self.assignment.title}"
