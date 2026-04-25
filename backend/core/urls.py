from django.http import JsonResponse
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventViewSet, GalleryImageViewSet, InquiryViewSet, AdmissionViewSet, StudentResultViewSet,
    TourBookingViewSet, ApplicationStageViewSet, application_status,
)


def healthcheck(_request):
    """Cheap health probe for UptimeRobot / Render / load balancer.
    Returns 200 + {"status":"ok"}. Stays cheap — no DB hit so a degraded DB
    doesn't take the whole probe down."""
    return JsonResponse({"status": "ok", "service": "best-legacy-api"})

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'gallery', GalleryImageViewSet)
router.register(r'inquiries', InquiryViewSet)
router.register(r'admissions', AdmissionViewSet)
router.register(r'results', StudentResultViewSet)
router.register(r'tour-bookings', TourBookingViewSet)
router.register(r'application-stages', ApplicationStageViewSet)

urlpatterns = [
    path('healthz/', healthcheck, name='healthcheck'),
    path('application-status/', application_status, name='application-status'),
    path('', include(router.urls)),
]
