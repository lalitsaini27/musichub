from django.conf import settings
from django.db import models
from django.utils.text import slugify


def unique_slugify(instance, value, slug_field="slug"):
    """Generate a unique slug for a model instance, appending -2, -3, ... on collision."""
    base_slug = slugify(value)
    slug = base_slug
    ModelClass = instance.__class__
    counter = 2
    while ModelClass.objects.filter(**{slug_field: slug}).exclude(pk=instance.pk).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


class Genre(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Artist(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    bio = models.TextField(blank=True)
    image = models.ImageField(upload_to="artists/images/", blank=True, null=True)
    cover_image = models.ImageField(upload_to="artists/covers/", blank=True, null=True)
    verified = models.BooleanField(default=False)
    monthly_listeners = models.PositiveIntegerField(default=0)
    genres = models.ManyToManyField(Genre, blank=True, related_name="artists")
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Album(models.Model):
    ALBUM = "album"
    SINGLE = "single"
    EP = "ep"
    ALBUM_TYPE_CHOICES = [(ALBUM, "Album"), (SINGLE, "Single"), (EP, "EP")]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="albums")
    cover_image = models.ImageField(upload_to="albums/covers/", blank=True, null=True)
    release_year = models.PositiveIntegerField()
    album_type = models.CharField(max_length=10, choices=ALBUM_TYPE_CHOICES, default=ALBUM)
    genres = models.ManyToManyField(Genre, blank=True, related_name="albums")
    is_featured = models.BooleanField(default=False)
    is_new_release = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-release_year", "title"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, f"{self.title}-{self.artist_id or ''}")
        super().save(*args, **kwargs)

    @property
    def total_duration_seconds(self):
        return sum(self.songs.values_list("duration_seconds", flat=True))

    def __str__(self):
        return f"{self.title} — {self.artist.name}"


class Song(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, blank=True)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="songs")
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name="songs", null=True, blank=True)
    genres = models.ManyToManyField(Genre, blank=True, related_name="songs")
    track_number = models.PositiveSmallIntegerField(default=1)
    duration_seconds = models.PositiveIntegerField(help_text="Track length in seconds")

    # For development/demo use royalty-free or clearly-labeled placeholder audio.
    audio_file = models.FileField(upload_to="songs/audio/", blank=True, null=True)
    audio_url = models.URLField(blank=True, help_text="Used if no audio_file is uploaded")

    cover_image = models.ImageField(
        upload_to="songs/covers/", blank=True, null=True,
        help_text="Optional override — falls back to the album cover"
    )

    lyrics = models.TextField(
        blank=True,
        help_text=(
            "Optional. LRC-style timed lyrics: one line per row, "
            "formatted as [mm:ss] lyric text, e.g. [0:05] Yeah... I've been tryna call"
        ),
    )

    play_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["track_number", "title"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, f"{self.title}-{self.artist_id or ''}")
        super().save(*args, **kwargs)

    @property
    def resolved_audio_url(self):
        if self.audio_file:
            return self.audio_file.url
        return self.audio_url or None

    @property
    def resolved_cover(self):
        if self.cover_image:
            return self.cover_image
        if self.album and self.album.cover_image:
            return self.album.cover_image
        return None

    def __str__(self):
        return f"{self.title} — {self.artist.name}"


class Follow(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="following")
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "artist")

    def __str__(self):
        return f"{self.user} follows {self.artist}"
