from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"health-logs",          views.HealthLogViewSet)
router.register(r"behaviour-entries",    views.BehaviourEntryViewSet)
router.register(r"events",               views.SchoolEventViewSet)
router.register(r"safeguarding",         views.SafeguardingIncidentViewSet)
router.register(r"drills",               views.DrillLogViewSet)
router.register(r"mood-pulses",          views.MoodPulseViewSet)
router.register(r"badges",               views.PupilBadgeViewSet)
router.register(r"certifications",       views.StaffCertificationViewSet)
router.register(r"policy-acks",          views.PolicyAcknowledgementViewSet)
router.register(r"curriculum",           views.CurriculumStrandViewSet)
router.register(r"reading-levels",       views.ReadingLevelViewSet)
router.register(r"comment-bank",         views.CommentBankViewSet)

urlpatterns = [
    path("digest/",   views.daily_digest,       name="wellbeing-digest"),
    path("calendar/", views.calendar_for_month, name="wellbeing-calendar"),
    path("", include(router.urls)),
]
