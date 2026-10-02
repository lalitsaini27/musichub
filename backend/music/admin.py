from django.contrib import admin
from .models import Genre, Artist, Album, Song, Follow


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ("name", "verified", "monthly_listeners", "is_featured")
    list_filter = ("verified", "is_featured", "genres")
    search_fields = ("name",)


class SongInline(admin.TabularInline):
    model = Song
    extra = 1
    fields = ("title", "track_number", "duration_seconds", "audio_url", "audio_file")


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ("title", "artist", "album_type", "release_year", "is_featured", "is_new_release")
    list_filter = ("album_type", "is_featured", "is_new_release", "genres")
    search_fields = ("title", "artist__name")
    inlines = [SongInline]


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ("title", "artist", "album", "duration_seconds", "play_count", "is_featured", "is_trending")
    list_filter = ("is_featured", "is_trending", "genres")
    search_fields = ("title", "artist__name", "album__title")


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("user", "artist", "created_at")
