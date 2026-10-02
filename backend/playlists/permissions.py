from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """Only the playlist's owner can modify or delete it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return obj.is_public or obj.owner_id == request.user.id
        return obj.owner_id == request.user.id


class IsStaffOrAdminUser(permissions.BasePermission):
    """Full access only to Django staff or MusicHub admin-flagged users."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.is_admin_user))
