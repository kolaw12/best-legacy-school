from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, GalleryImageViewSet, InquiryViewSet, AdmissionViewSet, StudentResultViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'gallery', GalleryImageViewSet)
router.register(r'inquiries', InquiryViewSet)
router.register(r'admissions', AdmissionViewSet)
router.register(r'results', StudentResultViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
