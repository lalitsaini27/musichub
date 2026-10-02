from rest_framework import serializers
from .models import Genre, Artist, Album, Song, Follow


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name", "slug"]


class ArtistListSerializer(serializers.ModelSerializer):
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Artist
        fields = [
            "id", "name", "slug", "image", "verified",
            "monthly_listeners", "is_featured", "is_following",
        ]

    def get_is_following(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return obj.followers.filter(user=user).exists()


class SongSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.name", read_only=True)
    artist_id = serializers.IntegerField(source="artist.id", read_only=True)
    album_title = serializers.CharField(source="album.title", read_only=True, default=None)
    cover_image = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = [
            "id", "title", "slug", "artist_id", "artist_name", "album", "album_title",
            "track_number", "duration_seconds", "audio_url", "cover_image", "lyrics",
            "play_count", "is_featured", "is_trending", "created_at",
        ]

    def get_cover_image(self, obj):
        cover = obj.resolved_cover
        if not cover:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(cover.url) if request else cover.url

    def get_audio_url(self, obj):
        return obj.resolved_audio_url


class SongWriteSerializer(serializers.ModelSerializer):
    """Used for create/update by admins — accepts raw FK ids and file uploads."""

    class Meta:
        model = Song
        fields = [
            "id", "title", "artist", "album", "genres", "track_number",
            "duration_seconds", "audio_file", "audio_url", "cover_image", "lyrics",
            "is_featured", "is_trending",
        ]


class AlbumListSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source="artist.name", read_only=True)

    class Meta:
        model = Album
        fields = [
            "id", "title", "slug", "artist", "artist_name", "cover_image",
            "release_year", "album_type", "is_featured", "is_new_release",
        ]


class AlbumDetailSerializer(serializers.ModelSerializer):
    artist = ArtistListSerializer(read_only=True)
    genres = GenreSerializer(many=True, read_only=True)
    songs = SongSerializer(many=True, read_only=True)
    total_duration_seconds = serializers.ReadOnlyField()

    class Meta:
        model = Album
        fields = [
            "id", "title", "slug", "artist", "cover_image", "release_year",
            "album_type", "genres", "songs", "total_duration_seconds",
            "is_featured", "is_new_release", "created_at",
        ]


class AlbumWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = [
            "id", "title", "artist", "cover_image", "release_year",
            "album_type", "genres", "is_featured", "is_new_release",
        ]


class ArtistDetailSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    albums = serializers.SerializerMethodField()
    singles = serializers.SerializerMethodField()
    popular_songs = serializers.SerializerMethodField()
    related_artists = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()

    class Meta:
        model = Artist
        fields = [
            "id", "name", "slug", "bio", "image", "cover_image", "verified",
            "monthly_listeners", "genres", "albums", "singles", "popular_songs",
            "related_artists", "is_following", "followers_count", "created_at",
        ]

    def get_albums(self, obj):
        qs = obj.albums.filter(album_type=Album.ALBUM)
        return AlbumListSerializer(qs, many=True, context=self.context).data

    def get_singles(self, obj):
        qs = obj.albums.filter(album_type__in=[Album.SINGLE, Album.EP])
        return AlbumListSerializer(qs, many=True, context=self.context).data

    def get_popular_songs(self, obj):
        qs = obj.songs.order_by("-play_count")[:10]
        return SongSerializer(qs, many=True, context=self.context).data

    def get_related_artists(self, obj):
        genre_ids = obj.genres.values_list("id", flat=True)
        qs = (
            Artist.objects.filter(genres__in=genre_ids)
            .exclude(id=obj.id)
            .distinct()[:8]
        )
        return ArtistListSerializer(qs, many=True, context=self.context).data

    def get_is_following(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return obj.followers.filter(user=user).exists()

    def get_followers_count(self, obj):
        return obj.followers.count()


class ArtistWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = [
            "id", "name", "bio", "image", "cover_image", "verified",
            "monthly_listeners", "genres", "is_featured",
        ]
