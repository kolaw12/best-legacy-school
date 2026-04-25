"""
Wellbeing covers the pastoral and clinical side of school life:
sickbay visits, behaviour merits/demerits, and the school-day calendar.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from academics.models import Student, Teacher, Term


class HealthLog(models.Model):
    SEVERITY = [
        ("minor",    "Minor — observed and treated"),
        ("moderate", "Moderate — guardian informed"),
        ("serious",  "Serious — sent home / referred"),
    ]
    student      = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="health_logs")
    visited_at   = models.DateTimeField(default=timezone.now)
    complaint    = models.CharField(max_length=200)
    action_taken = models.CharField(max_length=300, blank=True)
    severity     = models.CharField(max_length=20, choices=SEVERITY, default="minor")
    sent_home    = models.BooleanField(default=False)
    guardian_notified = models.BooleanField(default=False)
    note         = models.TextField(blank=True)
    nurse        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name="+")
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-visited_at"]

    def __str__(self):
        return f"{self.student.full_name} · {self.visited_at:%d %b %H:%M}"


class BehaviourEntry(models.Model):
    KIND = [
        ("merit",   "Merit — keep doing this"),
        ("demerit", "Demerit — gentle correction"),
        ("note",    "Pastoral note"),
    ]
    student    = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="behaviour_entries")
    kind       = models.CharField(max_length=10, choices=KIND, default="merit")
    points     = models.IntegerField(default=1)
    title      = models.CharField(max_length=120)
    detail     = models.TextField(blank=True)
    teacher    = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name="behaviour_entries")
    term       = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name="behaviour_entries")
    is_visible_to_parent = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Behaviour entries"

    def __str__(self):
        return f"{self.student.full_name} · {self.kind} · {self.title[:30]}"


class SchoolEvent(models.Model):
    KIND = [
        ("holiday",    "Holiday"),
        ("term_start", "Term begins"),
        ("term_end",   "Term ends"),
        ("midterm",    "Mid-term break"),
        ("exam",       "Exam / assessment"),
        ("ptm",        "Parent–teacher meeting"),
        ("sports",     "Sports / inter-house"),
        ("cultural",   "Cultural / arts day"),
        ("trip",       "Excursion"),
        ("closure",    "Emergency closure"),
        ("other",      "Other"),
    ]
    AUDIENCE = [
        ("all",     "Everyone"),
        ("staff",   "Staff only"),
        ("parents", "Parents + staff"),
        ("nursery", "Nursery section only"),
        ("basic",   "Basic section only"),
    ]
    title        = models.CharField(max_length=120)
    description  = models.TextField(blank=True)
    start_date   = models.DateField()
    end_date     = models.DateField(null=True, blank=True)
    starts_at    = models.TimeField(null=True, blank=True)
    ends_at      = models.TimeField(null=True, blank=True)
    location     = models.CharField(max_length=120, blank=True)
    kind         = models.CharField(max_length=20, choices=KIND, default="other")
    audience     = models.CharField(max_length=20, choices=AUDIENCE, default="all")
    is_published = models.BooleanField(default=True)
    created_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name="+")
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["start_date", "starts_at"]

    def __str__(self):
        return f"{self.start_date} · {self.title}"

    @property
    def is_multi_day(self):
        return bool(self.end_date and self.end_date != self.start_date)


# ===== Safeguarding incident reporting =====================================
class SafeguardingIncident(models.Model):
    """A 'concern' filed by any staff member. Visible only to the DSL by RBAC."""
    SEVERITY = [
        ("info",     "Information / context"),
        ("low",      "Low — monitor"),
        ("medium",   "Medium — investigate"),
        ("high",     "High — immediate action"),
    ]
    STATUS = [
        ("filed",      "Filed"),
        ("triaged",    "Triaged by DSL"),
        ("in_progress", "Action in progress"),
        ("closed",     "Closed"),
    ]
    student      = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="safeguarding_incidents",
                                     null=True, blank=True, help_text="Optional — some incidents are about adults.")
    summary      = models.CharField(max_length=200)
    detail       = models.TextField()
    severity     = models.CharField(max_length=10, choices=SEVERITY, default="low")
    status       = models.CharField(max_length=20, choices=STATUS, default="filed")
    filed_by     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name="+")
    triaged_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name="+")
    triage_note  = models.TextField(blank=True)
    occurred_at  = models.DateTimeField(default=timezone.now)
    closed_at    = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Safeguarding incident"

    def __str__(self):
        return f"{self.severity} · {self.summary[:50]}"


# ===== Drill log (fire / lockdown) =========================================
class DrillLog(models.Model):
    KIND = [("fire", "Fire drill"), ("lockdown", "Lockdown drill"), ("evacuation", "Evacuation")]
    kind          = models.CharField(max_length=20, choices=KIND, default="fire")
    held_at       = models.DateTimeField(default=timezone.now)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True,
                                                   help_text="Time-to-evacuate / drill duration.")
    pupils_count  = models.PositiveIntegerField(null=True, blank=True)
    staff_count   = models.PositiveIntegerField(null=True, blank=True)
    observations  = models.TextField(blank=True)
    led_by        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name="+")
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-held_at"]

    def __str__(self):
        return f"{self.kind} · {self.held_at:%d %b %Y}"


# ===== Mood pulse (weekly emoji per pupil) =================================
class MoodPulse(models.Model):
    EMOJI = [
        ("great",  "😄 Great"),
        ("ok",     "🙂 OK"),
        ("meh",    "😐 Meh"),
        ("sad",    "😞 Sad"),
        ("worried", "😟 Worried"),
    ]
    student   = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="mood_pulses")
    mood      = models.CharField(max_length=10, choices=EMOJI, default="ok")
    note      = models.CharField(max_length=200, blank=True)
    pulsed_on = models.DateField(default=timezone.localdate)
    captured_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-pulsed_on"]
        unique_together = [("student", "pulsed_on")]

    def __str__(self):
        return f"{self.student.full_name} · {self.pulsed_on} · {self.mood}"


# ===== Pupil badges (skills passport) ======================================
class PupilBadge(models.Model):
    student   = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="badges")
    code      = models.CharField(max_length=40, help_text='e.g. "reader-10", "kindness", "sports-day"')
    label     = models.CharField(max_length=120)
    icon      = models.CharField(max_length=10, default="🏅", help_text="Emoji / single character.")
    awarded_on = models.DateField(default=timezone.localdate)
    note      = models.CharField(max_length=200, blank=True)
    awarded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-awarded_on"]

    def __str__(self):
        return f"{self.student.full_name} · {self.label}"


# ===== Staff certification + policy acknowledgement ========================
class StaffCertification(models.Model):
    user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                  related_name="certifications")
    title     = models.CharField(max_length=120, help_text='e.g. "First Aid (FAA)", "Child Protection"')
    issuer    = models.CharField(max_length=120, blank=True)
    issued_on = models.DateField()
    expires_on = models.DateField(null=True, blank=True)
    document  = models.FileField(upload_to="certifications/", blank=True, null=True)
    note      = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["expires_on"]

    def __str__(self):
        return f"{self.user.username} · {self.title}"


class PolicyAcknowledgement(models.Model):
    POLICY = [
        ("safeguarding", "Safeguarding"),
        ("data_protection", "Data Protection"),
        ("code_of_conduct", "Staff Code of Conduct"),
        ("anti_bullying", "Anti-bullying"),
        ("acceptable_use", "Acceptable Use of ICT"),
    ]
    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name="policy_acks")
    policy      = models.CharField(max_length=30, choices=POLICY)
    version     = models.CharField(max_length=20, default="1.0")
    acknowledged_at = models.DateTimeField(default=timezone.now)
    ip          = models.CharField(max_length=45, blank=True)

    class Meta:
        unique_together = [("user", "policy", "version")]
        ordering = ["-acknowledged_at"]

    def __str__(self):
        return f"{self.user.username} · {self.policy} v{self.version}"


# ===== Curriculum map ======================================================
class CurriculumStrand(models.Model):
    """One learning strand per class × subject × term."""
    class_level = models.ForeignKey("academics.ClassLevel", on_delete=models.CASCADE,
                                    related_name="curriculum_strands")
    subject     = models.ForeignKey("academics.Subject", on_delete=models.CASCADE,
                                    related_name="curriculum_strands")
    term        = models.ForeignKey(Term, on_delete=models.CASCADE, related_name="curriculum_strands")
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    week_number = models.PositiveIntegerField(null=True, blank=True, help_text="Week 1-13 of term.")
    is_covered  = models.BooleanField(default=False)
    note        = models.CharField(max_length=200, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["term", "class_level", "subject", "week_number"]

    def __str__(self):
        return f"{self.class_level.name} · {self.subject.name} · {self.title[:30]}"


# ===== Reading level tracker ===============================================
class ReadingLevel(models.Model):
    LEVELS = [(c, c) for c in ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"]]
    student   = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="reading_levels")
    term      = models.ForeignKey(Term, on_delete=models.CASCADE, related_name="reading_levels")
    level     = models.CharField(max_length=2, choices=LEVELS, help_text="Fountas & Pinnell-style level.")
    fluency_wpm = models.PositiveIntegerField(null=True, blank=True, help_text="Oral reading fluency, words/min.")
    note      = models.TextField(blank=True)
    assessed_on = models.DateField(default=timezone.localdate)
    teacher   = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-assessed_on"]
        unique_together = [("student", "term")]

    def __str__(self):
        return f"{self.student.full_name} · L{self.level}"


# ===== Report-card comment bank ============================================
class CommentBankEntry(models.Model):
    BAND = [
        ("excellent", "Excellent (A)"),
        ("good",      "Good (B)"),
        ("average",   "Average (C/D)"),
        ("below",     "Below average (E/F)"),
        ("effort",    "Effort note"),
        ("behaviour", "Behaviour note"),
    ]
    subject     = models.ForeignKey("academics.Subject", on_delete=models.CASCADE,
                                    related_name="comment_bank", null=True, blank=True,
                                    help_text="Leave blank for cross-subject behaviour/effort comments.")
    band        = models.CharField(max_length=20, choices=BAND, default="good")
    text        = models.TextField()
    contributed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                       null=True, blank=True, related_name="+")
    times_used  = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-times_used", "subject", "band"]

    def __str__(self):
        return f"{self.band}: {self.text[:40]}"
