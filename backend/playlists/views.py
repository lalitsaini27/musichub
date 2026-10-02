from django.db.models import Q, Max
from rest_framework import viewsets, permissions, status, filters, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView

from music.models import Song
from music.serializers import SongSerializer
from .models import Playlist, PlaylistSong, PlaylistLike, LikedSong, RecentlyPlayed
from .permissions import IsOwner, IsStaffOrAdminUser
from .serializers import (
    PlaylistListSerializer, PlaylistDetailSerializer, PlaylistWriteSerializer,
    LikedSongSerializer, RecentlyPlayedSerializer,
)


class PlaylistViewSet(viewsets.ModelViewSet):
    """
    List shows the current user's own playlists plus everyone else's public
    ones. Only the owner can edit, delete, or manage songs on a playlist.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwner]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description"]

    def get_queryset(self):
        user = self.request.user
        base = Playlist.objects.select_related("owner").prefetch_related("playlist_songs")
        if user.is_authenticated:
            return base.filter(Q(is_public=True) | Q(owner=user))
        return base.filter(is_public=True)

    def get_serializer_class(self):
        if self.action == "list":
            return PlaylistListSerializer
        if self.action in ("create", "update", "partial_update"):
            return PlaylistWriteSerializer
        return PlaylistDetailSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        qs = Playlist.objects.filter(owner=request.user)
        serializer = PlaylistListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def add_song(self, request, pk=None):
        playlist = self.get_object()
        if playlist.owner_id != request.user.id:
            return Response({"detail": "Only the owner can modify this playlist."}, status=403)
        song_id = request.data.get("song")
        if not song_id:
            return Response({"song": "This field is required."}, status=400)
        song = Song.objects.filter(pk=song_id).first()
        if not song:
            return Response({"detail": "Song not found."}, status=404)

        if PlaylistSong.objects.filter(playlist=playlist, song=song).exists():
            return Response({"detail": "Song is already in this playlist."}, status=400)

        max_pos = playlist.playlist_songs.aggregate(m=Max("position"))["m"] or 0
        PlaylistSong.objects.create(playlist=playlist, song=song, position=max_pos + 1)
        return Response(PlaylistDetailSerializer(playlist, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def remove_song(self, request, pk=None):
        playlist = self.get_object()
        if playlist.owner_id != request.user.id:
            return Response({"detail": "Only the owner can modify this playlist."}, status=403)
        song_id = request.data.get("song")
        deleted, _ = PlaylistSong.objects.filter(playlist=playlist, song_id=song_id).delete()
        if not deleted:
            return Response({"detail": "That song isn't in this playlist."}, status=404)
        return Response(PlaylistDetailSerializer(playlist, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def reorder(self, request, pk=None):
        """Body: { "song_ids": [3, 1, 2, ...] } — full ordered list of song ids."""
        playlist = self.get_object()
        if playlist.owner_id != request.user.id:
            return Response({"detail": "Only the owner can modify this playlist."}, status=403)
        song_ids = request.data.get("song_ids")
        if not isinstance(song_ids, list):
            return Response({"song_ids": "Must be a list of song ids."}, status=400)

        for position, song_id in enumerate(song_ids, start=1):
            PlaylistSong.objects.filter(playlist=playlist, song_id=song_id).update(position=position)

        return Response(PlaylistDetailSerializer(playlist, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        playlist = self.get_object()
        PlaylistLike.objects.get_or_create(user=request.user, playlist=playlist)
        return Response({"detail": "Playlist liked.", "is_liked": True})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def unlike(self, request, pk=None):
        playlist = self.get_object()
        PlaylistLike.objects.filter(user=request.user, playlist=playlist).delete()
        return Response({"detail": "Playlist unliked.", "is_liked": False})


class LikedSongListView(ListAPIView):
    """GET /api/v1/liked-songs/ — current user's liked songs, most recent first."""
    serializer_class = LikedSongSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LikedSong.objects.filter(user=self.request.user).select_related(
            "song", "song__artist", "song__album"
        )


class LikeSongView(APIView):
    """POST /api/v1/songs/{song_id}/like-toggle/ — like a song."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, song_id):
        song = Song.objects.filter(pk=song_id).first()
        if not song:
            return Response({"detail": "Song not found."}, status=404)
        LikedSong.objects.get_or_create(user=request.user, song=song)
        return Response({"detail": "Song liked.", "is_liked": True})

    def delete(self, request, song_id):
        LikedSong.objects.filter(user=request.user, song_id=song_id).delete()
        return Response({"detail": "Song unliked.", "is_liked": False})


class RecentlyPlayedListView(ListAPIView):
    """GET /api/v1/recently-played/ — current user's listening history, most recent first."""
    serializer_class = RecentlyPlayedSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecentlyPlayed.objects.filter(user=self.request.user).select_related(
            "song", "song__artist", "song__album"
        )


class RecordPlayView(APIView):
    """
    POST /api/v1/recently-played/record/  Body: { "song": <id> }
    Upserts the (user, song) row and bumps the song's global play_count.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        song_id = request.data.get("song")
        song = Song.objects.filter(pk=song_id).first()
        if not song:
            return Response({"detail": "Song not found."}, status=404)

        entry, created = RecentlyPlayed.objects.get_or_create(user=request.user, song=song)
        if not created:
            entry.play_count += 1
            entry.save()  # auto_now bumps played_at too

        song.play_count += 1
        song.save(update_fields=["play_count"])

        return Response(RecentlyPlayedSerializer(entry, context={"request": request}).data)


class ClearRecentlyPlayedView(APIView):
    """DELETE /api/v1/recently-played/clear/ — wipe the current user's history."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        RecentlyPlayed.objects.filter(user=request.user).delete()
        return Response({"detail": "Recently played history cleared."})


class AdminPlaylistViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """
    /api/v1/admin/playlists/ — Admin Dashboard visibility over every playlist
    (public or private, any owner). Delete is the only moderation action
    exposed here; editing someone else's playlist contents is not.
    """
    queryset = Playlist.objects.all().select_related('owner').prefetch_related('playlist_songs')
    serializer_class = PlaylistListSerializer
    permission_classes = [IsStaffOrAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'owner__username']
