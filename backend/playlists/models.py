from django.conf import settings
from django.db import models
from music.models import Song


class Playlist(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="playlists")
    title = models.CharField(max_length=150)
    description = models.CharField(max_length=300, blank=True)
    cover_image = models.ImageField(upload_to="playlists/covers/", blank=True, null=True)
    is_public = models.BooleanField(default=True)
    songs = models.ManyToManyField(Song, through="PlaylistSong", related_name="playlists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.owner})"


class PlaylistSong(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name="playlist_songs")
    song = models.ForeignKey(Song, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "added_at"]
        unique_together = ("playlist", "song")

    def __str__(self):
        return f"{self.song.title} in {self.playlist.title}"


class PlaylistLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="liked_playlists")
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name="likes")
    liked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "playlist")


class LikedSong(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="liked_songs")
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="liked_by")
    liked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-liked_at"]
        unique_together = ("user", "song")

    def __str__(self):
        return f"{self.user} likes {self.song.title}"


class RecentlyPlayed(models.Model):
    """
    One row per (user, song) — replayed tracks bump `played_at` rather than
    creating duplicate history entries, which keeps the "Recently Played"
    list showing distinct, most-recently-heard songs first.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recently_played")
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="recent_plays")
    played_at = models.DateTimeField(auto_now=True)
    play_count = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["-played_at"]
        unique_together = ("user", "song")

    def __str__(self):
        return f"{self.user} played {self.song.title}"
