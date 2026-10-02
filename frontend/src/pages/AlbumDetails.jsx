import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Pause } from "lucide-react";

import SongRow from "../components/SongRow";
import AddToPlaylistModal from "../components/AddToPlaylistModal";

import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { getAlbum } from "../services/music";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%231c2028'/%3E%3C/svg%3E";

function toPlayable(song) {
  return {
    id: song.id, title: song.title, artist: song.artist_name,
    coverUrl: song.cover_image || FALLBACK, audioUrl: song.audio_url, lyrics: song.lyrics,
  };
}

function formatTotalDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

const ALBUM_TYPE_LABEL = { album: "Album", single: "Single", ep: "EP" };

export default function AlbumDetails() {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { currentSong, isPlaying, playQueue, togglePlay } = usePlayer();

  const [album, setAlbum] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState(null);

  useEffect(() => {
    setAlbum(null);
    setNotFound(false);
    getAlbum(slug).then((r) => setAlbum(r.data)).catch(() => setNotFound(true));
  }, [slug]);

  const isThisAlbumPlaying = album?.songs?.some((s) => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!album?.songs?.length) return;
    if (album.songs.some((s) => s.id === currentSong?.id)) { togglePlay(); return; }
    playQueue(album.songs.map(toPlayable), 0);
  };

  if (notFound) {
    return (
      <div className="px-3 px-lg-4 py-5 text-center">
        <p className="fw-semibold mb-1">Album not found</p>
        <p className="text-secondary small">This album may have been removed.</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="px-3 px-lg-4 py-5">
        <div className="mh-skeleton" style={{ height: 220, borderRadius: "var(--mh-radius-lg)" }} />
      </div>
    );
  }

  return (
    <div>
      <div
        className="d-flex flex-column flex-md-row align-items-md-end gap-4 p-4 p-lg-5"
        style={{ background: "linear-gradient(180deg, rgba(124,58,237,0.25), var(--mh-bg))" }}
      >
        <img
          src={album.cover_image || FALLBACK}
          alt={album.title}
          style={{ width: 200, height: 200, objectFit: "cover", borderRadius: "var(--mh-radius-md)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
        />
        <div>
          <div className="text-secondary small text-uppercase">{ALBUM_TYPE_LABEL[album.album_type]}</div>
          <h1 className="fw-bold mb-2" style={{ fontSize: "clamp(1.5rem, 4vw, 2.6rem)" }}>{album.title}</h1>
          <div
            className="text-secondary"
            role="button"
            onClick={() => navigate(`/artist/${album.artist.slug}`)}
            style={{ cursor: "pointer" }}
          >
            <span className="fw-semibold text-white">{album.artist.name}</span> · {album.release_year} ·{" "}
            {album.songs.length} songs, {formatTotalDuration(album.total_duration_seconds)}
          </div>
        </div>
      </div>

      <div className="px-3 px-lg-4 py-4">
        <button
          className="mh-btn-primary d-flex align-items-center gap-2 px-4 mb-4"
          style={{ width: "auto" }}
          onClick={handlePlayAll}
          disabled={!album.songs.length}
        >
          {isThisAlbumPlaying ? <Pause size={16} color="#0b0d10" /> : <Play size={16} fill="#0b0d10" />}
          {isThisAlbumPlaying ? "Pause" : "Play"}
        </button>

        <div className="d-flex flex-column gap-1">
          {album.songs.map((song, i) => (
            <SongRow
              key={song.id} song={song} index={i + 1} queue={album.songs}
              onAddToPlaylist={isAuthenticated ? () => setAddToPlaylistSong(song) : undefined}
            />
          ))}
          {album.songs.length === 0 && <p className="text-secondary small">No tracks on this album yet.</p>}
        </div>
      </div>

      {addToPlaylistSong && <AddToPlaylistModal song={addToPlaylistSong} onClose={() => setAddToPlaylistSong(null)} />}
    </div>
  );
}
