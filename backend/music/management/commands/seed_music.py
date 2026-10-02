from django.core.management.base import BaseCommand
from music.models import Genre, Artist, Album, Song

# Royalty-free placeholder audio (public domain / CC0 sample tones), used only
# so playback can be tested end-to-end during development.
SAMPLE_AUDIO = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{}.mp3"

# Original sample lyrics (written for this project, LRC-timed) for a couple of
# tracks, so the Live Lyrics panel has something real to demonstrate with.
SAMPLE_LYRICS = {
    "Chrome Skyline": (
        "[0:05] Lights are climbing up the chrome skyline\n"
        "[0:12] I've been driving since the sun went down\n"
        "[0:19] Radio static, city glow behind\n"
        "[0:26] Nothing left to lose in this town\n"
        "[0:34] Hold on, hold on\n"
        "[0:38] We're not done till the night is gone\n"
        "[0:46] Hold on, hold on\n"
        "[0:50] Chrome skyline, keep me moving on"
    ),
    "Paper Lanterns": (
        "[0:04] Paper lanterns on the water\n"
        "[0:11] Carrying the words I couldn't say\n"
        "[0:18] Watching every light get smaller\n"
        "[0:25] Watching all my doubts float away\n"
        "[0:33] Maybe I don't need the answer\n"
        "[0:40] Maybe letting go is enough\n"
        "[0:47] Paper lanterns on the water\n"
        "[0:54] Carry me when it gets rough"
    ),
}


class Command(BaseCommand):
    help = "Seed the database with original sample artists/albums/songs for development."

    def handle(self, *args, **options):
        genre_names = ["Synthwave", "Lo-Fi", "Indie Pop", "Electronic", "Acoustic"]
        genres = {name: Genre.objects.get_or_create(name=name)[0] for name in genre_names}

        artists_data = [
            {
                "name": "Nova Ridge",
                "bio": "A synthwave project blending retro-futuristic tones with modern production.",
                "verified": True,
                "monthly_listeners": 482_300,
                "is_featured": True,
                "genres": ["Synthwave", "Electronic"],
            },
            {
                "name": "Amber Fields",
                "bio": "Indie-pop singer-songwriter known for warm, introspective melodies.",
                "verified": True,
                "monthly_listeners": 215_700,
                "is_featured": True,
                "genres": ["Indie Pop", "Acoustic"],
            },
            {
                "name": "Quiet Static",
                "bio": "Lo-fi beatmaker crafting cozy, late-night instrumentals.",
                "verified": False,
                "monthly_listeners": 98_400,
                "is_featured": False,
                "genres": ["Lo-Fi"],
            },
        ]

        artists = {}
        for data in artists_data:
            genre_list = data.pop("genres")
            artist, _ = Artist.objects.get_or_create(name=data["name"], defaults=data)
            artist.genres.set([genres[g] for g in genre_list])
            artists[artist.name] = artist

        albums_data = [
            {"title": "Midnight Circuit", "artist": "Nova Ridge", "release_year": 2025,
             "album_type": Album.ALBUM, "genres": ["Synthwave"], "is_featured": True, "is_new_release": True,
             "tracks": ["Chrome Skyline", "Neon Drift", "Static Horizon", "Afterglow"]},
            {"title": "Paper Lanterns", "artist": "Amber Fields", "release_year": 2024,
             "album_type": Album.ALBUM, "genres": ["Indie Pop"], "is_featured": True, "is_new_release": False,
             "tracks": ["Paper Lanterns", "Slow Bloom", "Quiet Hours"]},
            {"title": "3AM Thoughts", "artist": "Quiet Static", "release_year": 2026,
             "album_type": Album.EP, "genres": ["Lo-Fi"], "is_featured": False, "is_new_release": True,
             "tracks": ["Rainy Window", "Half Awake"]},
            {"title": "Solstice", "artist": "Nova Ridge", "release_year": 2026,
             "album_type": Album.SINGLE, "genres": ["Synthwave", "Electronic"], "is_featured": False, "is_new_release": True,
             "tracks": ["Solstice"]},
        ]

        song_counter = 1
        for data in albums_data:
            genre_list = data.pop("genres")
            tracks = data.pop("tracks")
            artist_name = data.pop("artist")
            album, _ = Album.objects.get_or_create(
                title=data["title"], artist=artists[artist_name], defaults=data
            )
            album.genres.set([genres[g] for g in genre_list])

            for i, track_title in enumerate(tracks, start=1):
                song, _ = Song.objects.get_or_create(
                    title=track_title,
                    artist=artists[artist_name],
                    album=album,
                    defaults={
                        "track_number": i,
                        "duration_seconds": 180 + (i * 17) % 60,
                        "audio_url": SAMPLE_AUDIO.format((song_counter % 16) + 1),
                        "play_count": (song_counter * 137) % 5000,
                        "is_featured": song_counter % 4 == 0,
                        "is_trending": song_counter % 3 == 0,
                        "lyrics": SAMPLE_LYRICS.get(track_title, ""),
                    },
                )
                song.genres.set(album.genres.all())
                song_counter += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {Genre.objects.count()} genres, {Artist.objects.count()} artists, "
            f"{Album.objects.count()} albums, {Song.objects.count()} songs."
        ))
