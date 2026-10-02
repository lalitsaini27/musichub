from rest_framework import serializers
from music.serializers import SongSerializer
from .models import Playlist, PlaylistSong, PlaylistLike, LikedSong, RecentlyPlayed


class PlaylistListSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    song_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = [
            "id", "title", "description", "cover_image", "is_public",
            "owner", "owner_username", "song_count", "is_liked", "updated_at",
        ]
        read_only_fields = ["owner"]

    def get_song_count(self, obj):
        return obj.playlist_songs.count()

    def get_is_liked(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return obj.likes.filter(user=user).exists()


class PlaylistDetailSerializer(PlaylistListSerializer):
    songs = serializers.SerializerMethodField()

    class Meta(PlaylistListSerializer.Meta):
        fields = PlaylistListSerializer.Meta.fields + ["songs"]

    def get_songs(self, obj):
        qs = obj.playlist_songs.select_related(
            "song", "song__artist", "song__album"
        ).order_by("position", "added_at")
        return [
            {**SongSerializer(ps.song, context=self.context).data, "position": ps.position}
            for ps in qs
        ]


class PlaylistWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = ["id", "title", "description", "cover_image", "is_public"]


class LikedSongSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)

    class Meta:
        model = LikedSong
        fields = ["id", "song", "liked_at"]


class RecentlyPlayedSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)

    class Meta:
        model = RecentlyPlayed
        fields = ["id", "song", "played_at", "play_count"]
