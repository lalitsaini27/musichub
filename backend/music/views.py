from django.db.models import Q
from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Genre, Artist, Album, Song, Follow
from .permissions import IsAdminOrReadOnly
from .serializers import (
    GenreSerializer,
    ArtistListSerializer, ArtistDetailSerializer, ArtistWriteSerializer,
    AlbumListSerializer, AlbumDetailSerializer, AlbumWriteSerializer,
    SongSerializer, SongWriteSerializer,
)


class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


class ArtistViewSet(viewsets.ModelViewSet):
    queryset = Artist.objects.all().prefetch_related("genres", "albums", "songs")
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["verified", "is_featured", "genres"]
    search_fields = ["name", "bio"]
    ordering_fields = ["monthly_listeners", "name", "created_at"]
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "list":
            return ArtistListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ArtistWriteSerializer
        return ArtistDetailSerializer

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, slug=None):
        artist = self.get_object()
        Follow.objects.get_or_create(user=request.user, artist=artist)
        return Response({"detail": f"Now following {artist.name}.", "is_following": True})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def unfollow(self, request, slug=None):
        artist = self.get_object()
        Follow.objects.filter(user=request.user, artist=artist).delete()
        return Response({"detail": f"Unfollowed {artist.name}.", "is_following": False})

    @action(detail=False, methods=["get"])
    def featured(self, request):
        qs = self.get_queryset().filter(is_featured=True)[:10]
        serializer = ArtistListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.all().select_related("artist").prefetch_related("genres", "songs")
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["album_type", "is_featured", "is_new_release", "artist", "genres", "release_year"]
    search_fields = ["title", "artist__name"]
    ordering_fields = ["release_year", "title", "created_at"]
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "list":
            return AlbumListSerializer
        if self.action in ("create", "update", "partial_update"):
            return AlbumWriteSerializer
        return AlbumDetailSerializer

    @action(detail=False, methods=["get"])
    def new_releases(self, request):
        qs = self.get_queryset().filter(is_new_release=True).order_by("-created_at")[:12]
        serializer = AlbumListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class SongViewSet(viewsets.ModelViewSet):
    queryset = Song.objects.all().select_related("artist", "album").prefetch_related("genres")
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["artist", "album", "genres", "is_featured", "is_trending"]
    search_fields = ["title", "artist__name", "album__title"]
    ordering_fields = ["play_count", "title", "created_at", "track_number"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return SongWriteSerializer
        return SongSerializer

    @action(detail=False, methods=["get"])
    def trending(self, request):
        qs = self.get_queryset().filter(is_trending=True).order_by("-play_count")[:12]
        serializer = SongSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        qs = self.get_queryset().filter(is_featured=True).order_by("-play_count")[:12]
        serializer = SongSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.AllowAny])
    def play(self, request, pk=None):
        """Increment play_count — called by the frontend player when a track starts."""
        song = self.get_object()
        song.play_count += 1
        song.save(update_fields=["play_count"])
        return Response({"play_count": song.play_count})
