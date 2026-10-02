import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, Heart, ArrowDownAZ, Clock } from "lucide-react";

import SongRow from "../components/SongRow";
import AddToPlaylistModal from "../components/AddToPlaylistModal";

import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { getLikedSongs } from "../services/music";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%231c2028'/%3E%3C/svg%3E";

function toPlayable(song) {
  return {
    id: song.id, title: song.title, artist: song.artist_name,
    coverUrl: song.cover_image || FALLBACK, audioUrl: song.audio_url, lyrics: song.lyrics,
  };
}

const SORTS = [
  { key: "recent", label: "Recently Liked" },
  { key: "title", label: "Title (A–Z)" },
  { key: "artist", label: "Artist (A–Z)" },
];

export default function LikedSongs() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { currentSong, isPlaying, playQueue, togglePlay, likedIds } = usePlayer();

  const [entries, setEntries] = useState(null); // raw LikedSong entries: [{ song, liked_at }]
  const [sort, setSort] = useState("recent");
  const [addToPlaylistSong, setAddToPlaylistSong] = useState(null);

  const load = () => {
    getLikedSongs()
      .then((r) => setEntries(r.data.results || r.data))
      .catch(() => setEntries([]));
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="px-3 px-lg-4 py-5 text-center">
        <Heart size={40} className="mb-3 text-secondary" />
        <p className="fw-semibold mb-1">Log in to see your liked songs</p>
        <button className="mh-btn-primary px-4 mt-2" style={{ width: "auto" }} onClick={() => navigate("/login")}>
          Log In
        </button>
      </div>
    );
  }

  // Source of truth for "is this still liked" is the global likedIds set,
  // so unliking a song here (or anywhere else) removes it from this list
  // immediately without needing a refetch.
  const songs = (entries || [])
    .filter((e) => likedIds.has(e.song.id))
    .map((e) => ({ ...e.song, _liked_at: e.liked_at }));

  const sorted = [...songs].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "artist") return a.artist_name.localeCompare(b.artist_name);
    return new Date(b._liked_at) - new Date(a._liked_at);
  });

  const isThisPlaying = sorted.some((s) => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!sorted.length) return;
    if (sorted.some((s) => s.id === currentSong?.id)) { togglePlay(); return; }
    playQueue(sorted.map(toPlayable), 0);
  };

  return (
    <div>
      <div
        className="d-flex flex-column flex-md-row align-items-md-end gap-4 p-4 p-lg-5"
        style={{ background: "linear-gradient(180deg, rgba(124,58,237,0.3), var(--mh-bg))" }}
      >
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ width: 160, height: 160, borderRadius: "var(--mh-radius-md)", background: "var(--mh-accent-gradient)" }}
        >
          <Heart size={56} color="#0b0d10" fill="#0b0d10" />
        </div>
        <div>
          <div className="text-secondary small text-uppercase">Playlist</div>
          <h1 className="fw-bold mb-2" style={{ fontSize: "clamp(1.5rem, 4vw, 2.6rem)" }}>Liked Songs</h1>
          <div className="text-secondary small">{entries === null ? "Loading..." : `${sorted.length} songs`}</div>
        </div>
      </div>

      <div className="px-3 px-lg-4 py-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <button
            className="mh-btn-primary d-flex align-items-center gap-2 px-4"
            style={{ width: "auto" }}
            onClick={handlePlayAll}
            disabled={!sorted.length}
          >
            {isThisPlaying ? <Pause size={16} color="#0b0d10" /> : <Play size={16} fill="#0b0d10" />}
            {isThisPlaying ? "Pause" : "Play All"}
          </button>

          <div className="d-flex align-items-center gap-2">
            <ArrowDownAZ size={14} className="text-secondary" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="form-select form-select-sm mh-input"
              style={{ width: "auto" }}
            >
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {entries === null && <p className="text-secondary small">Loading your liked songs...</p>}

        {entries !== null && sorted.length === 0 && (
          <div className="text-center py-5">
            <p className="fw-semibold mb-1">Songs you like will appear here</p>
            <p className="text-secondary small">Tap the heart on any song to save it.</p>
          </div>
        )}

        <div className="d-flex flex-column gap-1">
          {sorted.map((song, i) => (
            <SongRow
              key={song.id} song={song} index={i + 1} queue={sorted} showAlbum
              onAddToPlaylist={() => setAddToPlaylistSong(song)}
            />
          ))}
        </div>
      </div>

      {addToPlaylistSong && <AddToPlaylistModal song={addToPlaylistSong} onClose={() => setAddToPlaylistSong(null)} />}
    </div>
  );
}
