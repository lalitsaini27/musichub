import { useEffect, useRef, useState } from "react";
import { Play, Pause, MoreHorizontal, Heart, Plus } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import AddToPlaylistModal from "./AddToPlaylistModal";

const FALLBACK_COVER =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%231c2028'/%3E%3C/svg%3E";

function toPlayable(song) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist_name,
    coverUrl: song.cover_image || FALLBACK_COVER,
    audioUrl: song.audio_url,
    lyrics: song.lyrics,
  };
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * A vertical card for a song — cover art, title, artist, duration, a play
 * button that appears on hover, and a "more options" menu (like / add to
 * playlist). `queue` is the full list of SongSerializer objects this card
 * belongs to, so clicking Play starts the whole context playing.
 */
export default function SongCard({ song, queue = [] }) {
  const { currentSong, isPlaying, playQueue, togglePlay, likedIds, toggleLike } = usePlayer();
  const { isAuthenticated } = useAuth();
  const isCurrent = currentSong?.id === song.id;
  const isLiked = likedIds.has(song.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
      return;
    }
    const startIndex = queue.findIndex((s) => s.id === song.id);
    playQueue((queue.length ? queue : [song]).map(toPlayable), Math.max(startIndex, 0));
  };

  return (
    <div
      className="mh-card-hover position-relative p-2"
      style={{ borderRadius: "var(--mh-radius-md)", cursor: "pointer", width: 168, flexShrink: 0 }}
      onClick={handlePlay}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div className="position-relative">
        <img
          src={song.cover_image || FALLBACK_COVER}
          alt={song.title}
          style={{
            width: "100%", aspectRatio: "1/1", objectFit: "cover",
            borderRadius: "var(--mh-radius-sm)",
          }}
        />
        <button
          className="position-absolute d-flex align-items-center justify-content-center mh-play-overlay"
          style={{
            bottom: 8, right: 8, width: 36, height: 36, borderRadius: "50%",
            background: "var(--mh-accent-gradient)", border: "none",
            opacity: isCurrent ? 1 : 0, transition: "opacity 0.15s ease, transform 0.15s ease",
          }}
          onClick={handlePlay}
          aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
        >
          {isCurrent && isPlaying
            ? <Pause size={16} color="#0b0d10" />
            : <Play size={16} color="#0b0d10" />}
        </button>
      </div>

      <div className="mt-2 d-flex align-items-start justify-content-between gap-1" style={{ minWidth: 0 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="text-truncate small fw-semibold">{song.title}</div>
          <div className="text-truncate text-secondary" style={{ fontSize: 12 }}>{song.artist_name}</div>
          <div className="text-secondary" style={{ fontSize: 11 }}>{formatDuration(song.duration_seconds)}</div>
        </div>

        <div className="position-relative" ref={menuRef}>
          <button
            className="mh-icon-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            aria-label="More options"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              className="position-absolute end-0 py-1"
              style={{ top: "100%", zIndex: 20, minWidth: 160, borderRadius: "var(--mh-radius-sm)", background: "var(--mh-surface-raised)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {isAuthenticated && (
                <>
                  <button className="dropdown-item-mh" onClick={() => { toggleLike(song.id); setMenuOpen(false); }}>
                    <Heart size={14} className="me-1" fill={isLiked ? "currentColor" : "none"} style={{ color: isLiked ? "var(--mh-accent-2)" : undefined }} />
                    {isLiked ? "Unlike" : "Like"}
                  </button>
                  <button className="dropdown-item-mh" onClick={() => { setShowAddToPlaylist(true); setMenuOpen(false); }}>
                    <Plus size={14} className="me-1" /> Add to Playlist
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <div className="px-3 py-2 text-secondary" style={{ fontSize: 12 }}>Log in to like or save songs</div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddToPlaylist && (
        <div onClick={(e) => e.stopPropagation()}>
          <AddToPlaylistModal song={song} onClose={() => setShowAddToPlaylist(false)} />
        </div>
      )}
    </div>
  );
}
