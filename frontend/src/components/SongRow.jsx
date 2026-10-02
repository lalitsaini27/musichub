import { Play, Pause, Heart, MoreHorizontal, X, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%231c2028'/%3E%3C/svg%3E";

function toPlayable(song) {
  return {
    id: song.id, title: song.title, artist: song.artist_name,
    coverUrl: song.cover_image || FALLBACK, audioUrl: song.audio_url, lyrics: song.lyrics,
  };
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * A single track row — used for popular songs, album tracklists, and
 * playlist contents. `queue` is the full list this row belongs to, so
 * clicking play starts that whole context.
 */
export default function SongRow({ song, index, queue = [], showAlbum = false, onRemove, onMoveUp, onMoveDown, onAddToPlaylist }) {
  const { currentSong, isPlaying, playQueue, togglePlay, likedIds, toggleLike } = usePlayer();
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isCurrent = currentSong?.id === song.id;
  const isLiked = likedIds.has(song.id);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handlePlay = () => {
    if (isCurrent) { togglePlay(); return; }
    const startIndex = queue.findIndex((s) => s.id === song.id);
    playQueue((queue.length ? queue : [song]).map(toPlayable), Math.max(startIndex, 0));
  };

  return (
    <div
      className="d-flex align-items-center gap-3 px-2 py-2 rounded-3"
      style={{ cursor: "pointer" }}
      onClick={handlePlay}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div className="text-secondary text-center" style={{ width: 22, fontSize: 13 }}>
        {isCurrent ? (isPlaying ? <Pause size={14} /> : <Play size={14} />) : (index ?? "")}
      </div>
      <img src={song.cover_image || FALLBACK} alt={song.title} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />
      <div className="flex-grow-1 text-truncate">
        <div className="text-truncate small fw-semibold" style={{ color: isCurrent ? "var(--mh-accent-2)" : undefined }}>{song.title}</div>
        <div className="text-truncate text-secondary" style={{ fontSize: 12 }}>{song.artist_name}</div>
      </div>
      {showAlbum && (
        <div className="text-secondary text-truncate d-none d-md-block" style={{ fontSize: 12, width: 140 }}>
          {song.album_title || "—"}
        </div>
      )}
      {isAuthenticated && (
        <button
          className="btn btn-sm p-1"
          style={{ background: "none", border: "none", color: isLiked ? "var(--mh-accent-2)" : "var(--mh-text-secondary)" }}
          onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
        </button>
      )}
      <div className="text-secondary" style={{ fontSize: 12, width: 42, textAlign: "right" }}>
        {formatDuration(song.duration_seconds)}
      </div>

      {(onRemove || onMoveUp || onMoveDown || onAddToPlaylist) && (
        <div className="position-relative" ref={menuRef}>
          <button
            className="btn btn-sm p-1 text-secondary"
            style={{ background: "none", border: "none" }}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              className="position-absolute end-0 mh-glass py-1"
              style={{ top: "100%", zIndex: 20, minWidth: 160, borderRadius: "var(--mh-radius-sm)", background: "var(--mh-surface-raised)" }}
            >
              {onAddToPlaylist && (
                <button className="dropdown-item-mh" onClick={(e) => { e.stopPropagation(); onAddToPlaylist(); setMenuOpen(false); }}>
                  Add to Playlist
                </button>
              )}
              {onMoveUp && (
                <button className="dropdown-item-mh" onClick={(e) => { e.stopPropagation(); onMoveUp(); setMenuOpen(false); }}>
                  <ArrowUp size={14} className="me-1" /> Move up
                </button>
              )}
              {onMoveDown && (
                <button className="dropdown-item-mh" onClick={(e) => { e.stopPropagation(); onMoveDown(); setMenuOpen(false); }}>
                  <ArrowDown size={14} className="me-1" /> Move down
                </button>
              )}
              {onRemove && (
                <button className="dropdown-item-mh text-danger" onClick={(e) => { e.stopPropagation(); onRemove(); setMenuOpen(false); }}>
                  <X size={14} className="me-1" /> Remove
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
