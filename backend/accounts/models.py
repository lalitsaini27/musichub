from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user for MusicHub.
    Extends Django's built-in user with the extra profile fields the
    frontend Profile / Settings pages need.
    """
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.CharField(max_length=200, blank=True)
    is_admin_user = models.BooleanField(
        default=False,
        help_text="Grants access to the MusicHub Admin Dashboard (separate from Django staff/superuser)."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username
