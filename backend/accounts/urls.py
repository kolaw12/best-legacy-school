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
    path("reset-password/<int:user_id>/", views.reset_user_password, name="auth-reset-password"),
    path("reset-guardian-password/<int:guardian_id>/", views.reset_guardian_password, name="auth-reset-guardian-password"),
    path("invite/", views.send_invite, name="auth-send-invite"),
    path("invite/preview/", views.accept_invite_preview, name="auth-invite-preview"),
    path("invite/accept/", views.accept_invite, name="auth-accept-invite"),
    path("search/", views.global_search, name="auth-search"),
    path("send-sms/", views.send_sms_view, name="auth-send-sms"),
    path("", include(router.urls)),
]
