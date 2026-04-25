from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"audit-log",     views.AuditLogViewSet,     basename="audit-log")
router.register(r"announcements", views.AnnouncementViewSet, basename="announcement")
router.register(r"threads",       views.MessageThreadViewSet, basename="thread")

urlpatterns = [
    path("login/", views.login_view, name="auth-login"),
    path("logout/", views.logout_view, name="auth-logout"),
    path("me/", views.me_view, name="auth-me"),
    path("me/children/", views.my_children, name="auth-my-children"),
    path("", include(router.urls)),
]
