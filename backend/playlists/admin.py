from django.contrib import admin
from .models import Playlist, PlaylistSong, PlaylistLike, LikedSong, RecentlyPlayed


class PlaylistSongInline(admin.TabularInline):
    model = PlaylistSong
    extra = 1


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "is_public", "updated_at")
    list_filter = ("is_public",)
    search_fields = ("title", "owner__username")
    inlines = [PlaylistSongInline]


@admin.register(LikedSong)
class LikedSongAdmin(admin.ModelAdmin):
    list_display = ("user", "song", "liked_at")


@admin.register(RecentlyPlayed)
class RecentlyPlayedAdmin(admin.ModelAdmin):
    list_display = ("user", "song", "played_at", "play_count")


admin.site.register(PlaylistLike)
