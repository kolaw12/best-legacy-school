"""
Role-based permission classes for DRF viewsets.

Usage:
    class MyViewSet(viewsets.ModelViewSet):
        permission_classes = [IsAdmin]

Read-only actions (list/retrieve) can be kept public by combining with
IsAuthenticatedOrReadOnly if needed.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Role, ADMIN_ROLES, STAFF_ROLES


def _role_of(request):
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return None
    profile = getattr(user, "profile", None)
    return profile.role if profile else None


class IsAdmin(BasePermission):
    """Super Admin or School Admin only."""
    message = "You must be a school admin to perform this action."

    def has_permission(self, request, view):
        return _role_of(request) in ADMIN_ROLES


class IsStaff(BasePermission):
    """Any staff role (admin, teacher, accountant, content manager)."""
    message = "You must be a member of staff."

    def has_permission(self, request, view):
        return _role_of(request) in STAFF_ROLES


class IsAdminOrReadOnly(BasePermission):
    """Reads are open; writes require admin."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return _role_of(request) in ADMIN_ROLES


class IsTeacherOrAdmin(BasePermission):
    """Attendance marking, grading, etc."""
    message = "Only teachers and admins may perform this action."

    def has_permission(self, request, view):
        role = _role_of(request)
        return role in ADMIN_ROLES or role == Role.TEACHER
