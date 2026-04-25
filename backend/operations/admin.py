from django.contrib import admin
from .models import (
    Book, BookLoan, LostFoundItem,
    BusRoute, BusStop, BusRiderAssignment, BusCheckpoint,
    LateCheckout, GeneratorFuelLog, OutageLog,
    Club, ClubBooking, FundraisingCampaign, Donation,
)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "section", "copies_total", "copies_on_loan", "copies_available")
    list_filter  = ("section",)
    search_fields = ("title", "author", "isbn")


@admin.register(BookLoan)
class BookLoanAdmin(admin.ModelAdmin):
    list_display = ("book", "student", "borrowed_on", "due_on", "returned_on", "fine")
    list_filter  = ("returned_on",)
    search_fields = ("book__title", "student__first_name", "student__last_name")
    autocomplete_fields = ("book", "student")


@admin.register(LostFoundItem)
class LostFoundAdmin(admin.ModelAdmin):
    list_display = ("description", "found_on", "found_at", "status", "claimed_by")
    list_filter  = ("status",)
    search_fields = ("description", "found_at", "claimed_by")


class BusStopInline(admin.TabularInline):
    model = BusStop
    extra = 1


@admin.register(BusRoute)
class BusRouteAdmin(admin.ModelAdmin):
    list_display = ("name", "driver_name", "driver_phone", "is_active")
    list_filter  = ("is_active",)
    search_fields = ("name", "driver_name")
    inlines = [BusStopInline]


@admin.register(BusStop)
class BusStopAdmin(admin.ModelAdmin):
    list_display = ("name", "route", "order", "pickup_time", "dropoff_time")
    list_filter  = ("route",)
    search_fields = ("name",)


@admin.register(BusRiderAssignment)
class BusRiderAssignmentAdmin(admin.ModelAdmin):
    list_display = ("student", "route", "stop")
    list_filter  = ("route",)
    autocomplete_fields = ("student", "route", "stop")


@admin.register(BusCheckpoint)
class BusCheckpointAdmin(admin.ModelAdmin):
    list_display = ("route", "kind", "stop", "pinged_at", "pinged_by")
    list_filter  = ("kind", "route")
    date_hierarchy = "pinged_at"


@admin.register(LateCheckout)
class LateCheckoutAdmin(admin.ModelAdmin):
    list_display = ("student", "logged_at", "status", "collected_at", "collected_by", "guardian_notified")
    list_filter  = ("status", "guardian_notified")
    autocomplete_fields = ("student",)
    date_hierarchy = "logged_at"


@admin.register(GeneratorFuelLog)
class GeneratorFuelLogAdmin(admin.ModelAdmin):
    list_display = ("kind", "litres", "cost_naira", "hours_run", "purchased_on")
    list_filter  = ("kind",)
    date_hierarchy = "purchased_on"


@admin.register(OutageLog)
class OutageLogAdmin(admin.ModelAdmin):
    list_display = ("kind", "started_at", "ended_at", "duration_minutes")
    list_filter  = ("kind",)
    date_hierarchy = "started_at"


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ("name", "schedule", "capacity", "fee_naira", "section", "is_active")
    list_filter  = ("section", "is_active")
    search_fields = ("name",)


@admin.register(ClubBooking)
class ClubBookingAdmin(admin.ModelAdmin):
    list_display = ("club", "student", "status", "booked_on")
    list_filter  = ("status", "club")
    autocomplete_fields = ("club", "student")


@admin.register(FundraisingCampaign)
class FundraisingCampaignAdmin(admin.ModelAdmin):
    list_display = ("title", "goal_naira", "raised_naira", "percent_raised", "is_active", "starts_on", "ends_on")
    list_filter  = ("is_active",)
    search_fields = ("title",)


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ("donor_name", "amount_naira", "campaign", "method", "given_on", "is_anonymous")
    list_filter  = ("method", "is_anonymous", "campaign")
    search_fields = ("donor_name", "donor_email", "donor_phone", "reference")
