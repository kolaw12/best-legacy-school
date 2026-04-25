from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"books",          views.BookViewSet)
router.register(r"book-loans",     views.BookLoanViewSet)
router.register(r"lost-found",     views.LostFoundViewSet)
router.register(r"bus-routes",     views.BusRouteViewSet)
router.register(r"bus-stops",      views.BusStopViewSet)
router.register(r"bus-riders",     views.BusRiderAssignmentViewSet)
router.register(r"bus-checkpoints", views.BusCheckpointViewSet)
router.register(r"late-checkouts", views.LateCheckoutViewSet)
router.register(r"fuel-logs",      views.GeneratorFuelLogViewSet)
router.register(r"outages",        views.OutageLogViewSet)
router.register(r"clubs",          views.ClubViewSet)
router.register(r"club-bookings",  views.ClubBookingViewSet)
router.register(r"campaigns",      views.FundraisingCampaignViewSet)
router.register(r"donations",      views.DonationViewSet)

urlpatterns = [path("", include(router.urls))]
