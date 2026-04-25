"""
Operations: school-day logistics that don't fit pastoral, academic, or finance:
- Library (books + loans)
- Lost & found board
- Bus routes + checkpoints
- Late-pickup register
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from academics.models import Student, ClassLevel


# ----- Library -------------------------------------------------------------
class Book(models.Model):
    SECTION = [("nursery", "Nursery"), ("basic", "Basic"), ("staff", "Staff")]
    title       = models.CharField(max_length=200)
    author      = models.CharField(max_length=200, blank=True)
    isbn        = models.CharField(max_length=20, blank=True)
    section     = models.CharField(max_length=10, choices=SECTION, default="basic")
    copies_total = models.PositiveIntegerField(default=1)
    cover       = models.ImageField(upload_to="books/", blank=True, null=True)
    note        = models.CharField(max_length=200, blank=True)
    added_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title

    @property
    def copies_on_loan(self):
        return self.loans.filter(returned_on__isnull=True).count()

    @property
    def copies_available(self):
        return max(0, self.copies_total - self.copies_on_loan)


class BookLoan(models.Model):
    book        = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="loans")
    student     = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="book_loans")
    borrowed_on = models.DateField(default=timezone.localdate)
    due_on      = models.DateField()
    returned_on = models.DateField(null=True, blank=True)
    fine        = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    note        = models.CharField(max_length=200, blank=True)
    issued_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name="+")
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-borrowed_on"]

    def __str__(self):
        return f"{self.book.title} → {self.student.full_name}"

    @property
    def is_overdue(self):
        return not self.returned_on and self.due_on < timezone.localdate()


# ----- Lost & Found --------------------------------------------------------
class LostFoundItem(models.Model):
    STATUS = [
        ("found",    "Found — awaiting claim"),
        ("claimed",  "Claimed"),
        ("disposed", "Disposed / donated"),
    ]
    description = models.CharField(max_length=200, help_text='e.g. "blue water bottle with stickers"')
    photo       = models.ImageField(upload_to="lost-found/", blank=True, null=True)
    found_on    = models.DateField(default=timezone.localdate)
    found_at    = models.CharField(max_length=120, blank=True, help_text="Where it was found.")
    class_level = models.ForeignKey(ClassLevel, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="+", help_text="Likely class, if known.")
    status      = models.CharField(max_length=10, choices=STATUS, default="found")
    claimed_by  = models.CharField(max_length=120, blank=True, help_text="Name of guardian / pupil who collected.")
    claimed_on  = models.DateField(null=True, blank=True)
    note        = models.CharField(max_length=200, blank=True)
    added_by    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name="+")
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-found_on", "-created_at"]
        verbose_name = "Lost & found item"

    def __str__(self):
        return f"{self.description[:40]} ({self.status})"


# ----- Bus routes ----------------------------------------------------------
class BusRoute(models.Model):
    name       = models.CharField(max_length=80, help_text='e.g. "Mowe → Ibafo loop"')
    driver_name = models.CharField(max_length=120, blank=True)
    driver_phone = models.CharField(max_length=20, blank=True)
    is_active  = models.BooleanField(default=True)
    note       = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class BusStop(models.Model):
    route = models.ForeignKey(BusRoute, on_delete=models.CASCADE, related_name="stops")
    name  = models.CharField(max_length=80)
    order = models.PositiveIntegerField(default=0, help_text="Pickup order, low → high.")
    pickup_time  = models.TimeField(null=True, blank=True)
    dropoff_time = models.TimeField(null=True, blank=True)

    class Meta:
        ordering = ["route", "order"]

    def __str__(self):
        return f"{self.route.name} · {self.name}"


class BusRiderAssignment(models.Model):
    """Which children ride which route + which stop is theirs."""
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="bus_assignment")
    route   = models.ForeignKey(BusRoute, on_delete=models.PROTECT, related_name="riders")
    stop    = models.ForeignKey(BusStop,  on_delete=models.PROTECT, related_name="riders")
    note    = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.full_name} → {self.route.name}/{self.stop.name}"


class BusCheckpoint(models.Model):
    """Driver / route monitor pings: 'left school', 'arrived stop X', 'completed route'."""
    KIND = [
        ("departed",   "Departed school"),
        ("approaching", "Approaching stop"),
        ("at_stop",    "At stop"),
        ("completed",  "Route completed"),
        ("incident",   "Incident — see note"),
    ]
    route   = models.ForeignKey(BusRoute, on_delete=models.CASCADE, related_name="checkpoints")
    stop    = models.ForeignKey(BusStop,  on_delete=models.SET_NULL, null=True, blank=True, related_name="checkpoints")
    kind    = models.CharField(max_length=20, choices=KIND, default="departed")
    pinged_at = models.DateTimeField(default=timezone.now)
    note    = models.CharField(max_length=200, blank=True)
    pinged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                  null=True, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-pinged_at"]

    def __str__(self):
        return f"{self.route.name} · {self.kind} · {self.pinged_at:%H:%M}"


# ----- Late pickup register ------------------------------------------------
class LateCheckout(models.Model):
    """End-of-day: gate staff log children still on premises after dismissal."""
    STATUS = [
        ("waiting",   "Still waiting"),
        ("collected", "Collected"),
        ("escalated", "Escalated to office"),
    ]
    student   = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="late_checkouts")
    logged_at = models.DateTimeField(default=timezone.now)
    collected_at = models.DateTimeField(null=True, blank=True)
    collected_by = models.CharField(max_length=120, blank=True,
                                    help_text="Name / relationship of who finally collected the child.")
    status    = models.CharField(max_length=10, choices=STATUS, default="waiting")
    guardian_notified = models.BooleanField(default=False)
    note      = models.CharField(max_length=200, blank=True)
    logged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                  null=True, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-logged_at"]

    def __str__(self):
        return f"{self.student.full_name} late · {self.logged_at:%d %b %H:%M}"


# ===== Generator fuel + outages ============================================
class GeneratorFuelLog(models.Model):
    KIND = [("diesel", "Diesel"), ("petrol", "Petrol"), ("solar_service", "Solar service")]
    kind         = models.CharField(max_length=20, choices=KIND, default="diesel")
    litres       = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    cost_naira   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hours_run    = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    purchased_on = models.DateField(default=timezone.localdate)
    note         = models.CharField(max_length=200, blank=True)
    logged_by    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name="+")
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-purchased_on"]

    def __str__(self):
        return f"{self.kind} · {self.litres}L · ₦{self.cost_naira} · {self.purchased_on}"


class OutageLog(models.Model):
    KIND = [
        ("power",    "Power outage"),
        ("internet", "Internet outage"),
        ("water",    "Water"),
        ("other",    "Other"),
    ]
    kind        = models.CharField(max_length=20, choices=KIND, default="power")
    started_at  = models.DateTimeField(default=timezone.now)
    ended_at    = models.DateTimeField(null=True, blank=True)
    impact_note = models.CharField(max_length=200, blank=True)
    logged_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name="+")
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.kind} · {self.started_at:%d %b %H:%M}"

    @property
    def duration_minutes(self):
        if not self.ended_at:
            return None
        return int((self.ended_at - self.started_at).total_seconds() / 60)


# ===== After-school clubs + bookings =======================================
class Club(models.Model):
    name        = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    schedule    = models.CharField(max_length=120, blank=True, help_text='e.g. "Mon & Wed 3-4pm"')
    capacity    = models.PositiveIntegerField(default=20)
    fee_naira   = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                      help_text="Per term. 0 = free.")
    section     = models.CharField(max_length=10, blank=True, choices=[("nursery", "Nursery"), ("basic", "Basic")])
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def seats_taken(self):
        return self.bookings.filter(status="confirmed").count()


class ClubBooking(models.Model):
    STATUS = [
        ("pending",    "Pending payment"),
        ("confirmed",  "Confirmed"),
        ("waitlist",   "Waitlist"),
        ("cancelled",  "Cancelled"),
    ]
    club    = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="bookings")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="club_bookings")
    status  = models.CharField(max_length=10, choices=STATUS, default="pending")
    booked_on = models.DateField(default=timezone.localdate)
    note      = models.CharField(max_length=200, blank=True)
    booked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                  null=True, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-booked_on"]
        unique_together = [("club", "student")]

    def __str__(self):
        return f"{self.student.full_name} → {self.club.name} ({self.status})"


# ===== Donations / fundraising =============================================
class FundraisingCampaign(models.Model):
    title       = models.CharField(max_length=120)
    blurb       = models.TextField(blank=True)
    goal_naira  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    raised_naira = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cover       = models.ImageField(upload_to="fundraising/", blank=True, null=True)
    starts_on   = models.DateField(default=timezone.localdate)
    ends_on     = models.DateField(null=True, blank=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_on"]

    def __str__(self):
        return self.title

    @property
    def percent_raised(self):
        if not self.goal_naira:
            return 0
        return min(100, round(float(self.raised_naira) / float(self.goal_naira) * 100))


class Donation(models.Model):
    campaign      = models.ForeignKey(FundraisingCampaign, on_delete=models.CASCADE, related_name="donations")
    donor_name    = models.CharField(max_length=120)
    donor_email   = models.EmailField(blank=True)
    donor_phone   = models.CharField(max_length=20, blank=True)
    amount_naira  = models.DecimalField(max_digits=12, decimal_places=2)
    method        = models.CharField(max_length=20, default="transfer")
    reference     = models.CharField(max_length=100, blank=True)
    is_anonymous  = models.BooleanField(default=False)
    note          = models.CharField(max_length=200, blank=True)
    given_on      = models.DateField(default=timezone.localdate)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-given_on"]

    def __str__(self):
        return f"{self.donor_name} · ₦{self.amount_naira} → {self.campaign.title}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            from django.db.models import F
            FundraisingCampaign.objects.filter(pk=self.campaign_id).update(
                raised_naira=F("raised_naira") + self.amount_naira
            )
