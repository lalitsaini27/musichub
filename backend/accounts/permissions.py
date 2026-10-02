from rest_framework import permissions


class IsStaffOrAdminUser(permissions.BasePermission):
    """Full access only to Django staff or MusicHub admin-flagged users."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.is_admin_user))
