import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History, Play, Pause, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import SongRow from "../components/SongRow";
import Modal from "../components/Modal";
import AddToPlaylistModal from "../components/AddToPlaylistModal";

import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { getRecentlyPlayed, clearRecentlyPlayed } from "../services/music";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%231c2028'/%3E%3C/svg%3E";

function toPlayable(song) {
  return {
    id: song.id, title: song.title, artist: song.artist_name,
    coverUrl: song.cover_image || FALLBACK, audioUrl: song.audio_url, lyrics: song.lyrics,
  };
}

export default function RecentlyPlayed() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { currentSong, isPlaying, playQueue, togglePlay } = usePlayer();

  const [entries, setEntries] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    getRecentlyPlayed().then((r) => setEntries(r.data.results || r.data)).catch(() => setEntries([]));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="px-3 px-lg-4 py-5 text-center">
        <History size={40} className="mb-3 text-secondary" />
        <p className="fw-semibold mb-1">Log in to see your listening history</p>
        <button className="mh-btn-primary px-4 mt-2" style={{ width: "auto" }} onClick={() => navigate("/login")}>
          Log In
        </button>
      </div>
    );
  }

  const songs = (entries || []).map((e) => e.song);
  const isThisPlaying = songs.some((s) => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!songs.length) return;
    if (songs.some((s) => s.id === currentSong?.id)) { togglePlay(); return; }
    playQueue(songs.map(toPlayable), 0);
  };

  const handleClear = async () => {
    try {
      await clearRecentlyPlayed();
      setEntries([]);
      setConfirmClear(false);
      toast.success("Listening history cleared.");
    } catch {
      toast.error("Couldn't clear history.");
    }
  };

  return (
    <div>
      <div className="px-3 px-lg-4 py-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="fw-bold mb-1">Recently Played</h1>
            <p className="text-secondary small mb-0">{entries === null ? "Loading..." : `${songs.length} tracks`}</p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="mh-btn-primary d-flex align-items-center gap-2 px-4"
              style={{ width: "auto" }}
              onClick={handlePlayAll}
              disabled={!songs.length}
            >
              {isThisPlaying ? <Pause size={16} color="#0b0d10" /> : <Play size={16} fill="#0b0d10" />}
              {isThisPlaying ? "Pause" : "Play All"}
            </button>
            {songs.length > 0 && (
              <button
                className="btn d-flex align-items-center gap-2 px-3"
                style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }}
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 size={16} /> Clear
              </button>
            )}
          </div>
        </div>

        {entries === null && <p className="text-secondary small">Loading your listening history...</p>}

        {entries !== null && songs.length === 0 && (
          <div className="text-center py-5">
            <p className="fw-semibold mb-1">Nothing played yet</p>
            <p className="text-secondary small">Songs you play will show up here.</p>
          </div>
        )}

        <div className="d-flex flex-column gap-1">
          {songs.map((song, i) => (
            <SongRow
              key={`${song.id}-${i}`} song={song} index={i + 1} queue={songs} showAlbum
              onAddToPlaylist={() => setAddToPlaylistSong(song)}
            />
          ))}
        </div>
      </div>

      {confirmClear && (
        <Modal title="Clear listening history?" onClose={() => setConfirmClear(false)} maxWidth={380}>
          <p className="text-secondary small mb-3">This removes your entire recently played list. This can't be undone.</p>
          <div className="d-flex gap-2 justify-content-end">
            <button
              className="btn btn-sm px-3"
              style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }}
              onClick={() => setConfirmClear(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-sm px-3"
              style={{ background: "#e5484d", border: "none", color: "#fff", borderRadius: "var(--mh-radius-sm)" }}
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </Modal>
      )}

      {addToPlaylistSong && <AddToPlaylistModal song={addToPlaylistSong} onClose={() => setAddToPlaylistSong(null)} />}
    </div>
  );
}
