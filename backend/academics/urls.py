from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"sessions", views.SessionViewSet)
router.register(r"terms", views.TermViewSet)
router.register(r"classes", views.ClassLevelViewSet)
router.register(r"subjects", views.SubjectViewSet)
router.register(r"guardians", views.GuardianViewSet)
router.register(r"teachers", views.TeacherViewSet)
router.register(r"students", views.StudentViewSet)
router.register(r"enrollments", views.EnrollmentViewSet)
router.register(r"attendance", views.AttendanceViewSet)
router.register(r"grades", views.BasicGradeViewSet)
router.register(r"assessments", views.NurseryAssessmentViewSet)
router.register(r"pickup-auths", views.PickupAuthorizationViewSet)

urlpatterns = [
    path("summary/", views.admin_summary, name="academics-admin-summary"),
    path("report-card/<int:student_id>/",     views.report_card,         name="academics-report-card"),
    path("report-card/<int:student_id>/pdf/", views.report_card_pdf,     name="academics-report-card-pdf"),
    path("students/bulk-import/",             views.students_bulk_import, name="academics-students-bulk-import"),
    path("students/promote/",                 views.promote_students,     name="academics-students-promote"),
    path("", include(router.urls)),
]
