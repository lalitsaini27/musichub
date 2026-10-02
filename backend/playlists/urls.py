from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("playlists", views.PlaylistViewSet, basename="playlist")

urlpatterns = router.urls + [
    path("liked-songs/", views.LikedSongListView.as_view(), name="liked-songs"),
    path("songs/<int:song_id>/like-toggle/", views.LikeSongView.as_view(), name="song-like-toggle"),
    path("recently-played/", views.RecentlyPlayedListView.as_view(), name="recently-played"),
    path("recently-played/record/", views.RecordPlayView.as_view(), name="recently-played-record"),
    path("recently-played/clear/", views.ClearRecentlyPlayedView.as_view(), name="recently-played-clear"),
]
