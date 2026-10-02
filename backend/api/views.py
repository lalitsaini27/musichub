from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from music.models import Artist, Album, Song
from music.serializers import ArtistListSerializer, AlbumListSerializer, SongSerializer
from playlists.models import Playlist
from playlists.serializers import PlaylistListSerializer


class SearchView(APIView):
    """
    GET /api/v1/search/?q=<query>&type=songs|artists|albums|playlists
    Omit `type` to search all four categories at once (used for the main
    Search page's "All" tab and search suggestions).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        result_type = request.query_params.get("type")

        if not query:
            return Response({"songs": [], "artists": [], "albums": [], "playlists": []})

        results = {}

        if result_type in (None, "songs"):
            songs = Song.objects.filter(title__icontains=query).select_related("artist", "album")[:20]
            results["songs"] = SongSerializer(songs, many=True, context={"request": request}).data

        if result_type in (None, "artists"):
            artists = Artist.objects.filter(name__icontains=query)[:20]
            results["artists"] = ArtistListSerializer(artists, many=True, context={"request": request}).data

        if result_type in (None, "albums"):
            albums = Album.objects.filter(title__icontains=query).select_related("artist")[:20]
            results["albums"] = AlbumListSerializer(albums, many=True, context={"request": request}).data

        if result_type in (None, "playlists"):
            playlists = Playlist.objects.filter(title__icontains=query, is_public=True)[:20]
            results["playlists"] = PlaylistListSerializer(playlists, many=True, context={"request": request}).data

        return Response(results)
