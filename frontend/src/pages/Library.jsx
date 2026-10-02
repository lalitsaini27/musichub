import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, History, ListMusic, Plus } from "lucide-react";

import PlaylistCard from "../components/PlaylistCard";
import AlbumCard from "../components/AlbumCard";
import ArtistCard from "../components/ArtistCard";
import Modal from "../components/Modal";

import { useAuth } from "../context/AuthContext";
import { getMyPlaylists, createPlaylist, getAlbums, getArtists } from "../services/music";
import { toast } from "react-toastify";

const TABS = [
  { key: "playlists", label: "Playlists" },
  { key: "albums", label: "Albums" },
  { key: "artists", label: "Artists" },
];

export default function Library() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState("playlists");

  const [playlists, setPlaylists] = useState(null);
  const [albums, setAlbums] = useState(null);
  const [artists, setArtists] = useState(null);

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  const loadPlaylists = () => {
    if (!isAuthenticated) { setPlaylists([]); return; }
    getMyPlaylists().then((r) => setPlaylists(r.data)).catch(() => setPlaylists([]));
  };

  useEffect(() => {
    loadPlaylists();
    getAlbums().then((r) => setAlbums(r.data.results || r.data)).catch(() => setAlbums([]));
    getArtists().then((r) => setArtists(r.data.results || r.data)).catch(() => setArtists([]));
  }, [isAuthenticated]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createPlaylist({ title: title.trim(), is_public: true });
      toast.success("Playlist created.");
      setTitle("");
      setCreating(false);
      loadPlaylists();
    } catch {
      toast.error("Couldn't create the playlist.");
    }
  };

  return (
    <div className="px-3 px-lg-4 py-4">
      <h1 className="fw-bold mb-4">Your Library</h1>

      {/* Quick links */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        <button
          className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
          style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)" }}
          onClick={() => navigate("/liked")}
        >
          <Heart size={18} style={{ color: "var(--mh-accent-2)" }} /> Liked Songs
        </button>
        <button
          className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
          style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)" }}
          onClick={() => navigate("/recently-played")}
        >
          <History size={18} /> Recently Played
        </button>
        {isAuthenticated && (
          <button
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
            style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)" }}
            onClick={() => setCreating(true)}
          >
            <Plus size={18} /> New Playlist
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="btn btn-sm px-3 py-1"
            style={{
              borderRadius: 999, border: "none",
              background: tab === t.key ? "var(--mh-accent-gradient)" : "var(--mh-surface-raised)",
              color: tab === t.key ? "#0b0d10" : "var(--mh-text-primary)",
              fontWeight: tab === t.key ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "playlists" && (
        <>
          {!isAuthenticated && <p className="text-secondary small">Log in to see your playlists.</p>}
          {isAuthenticated && playlists === null && <p className="text-secondary small">Loading...</p>}
          {isAuthenticated && playlists?.length === 0 && (
            <p className="text-secondary small">No playlists yet — create one above.</p>
          )}
          <div className="d-flex flex-wrap gap-3">
            {playlists?.map((p) => <PlaylistCard key={p.id} playlist={p} />)}
          </div>
        </>
      )}

      {tab === "albums" && (
        <>
          {albums === null && <p className="text-secondary small">Loading...</p>}
          {albums?.length === 0 && <p className="text-secondary small">No albums yet.</p>}
          <div className="d-flex flex-wrap gap-3">
            {albums?.map((a) => <AlbumCard key={a.id} album={a} />)}
          </div>
        </>
      )}

      {tab === "artists" && (
        <>
          {artists === null && <p className="text-secondary small">Loading...</p>}
          {artists?.length === 0 && <p className="text-secondary small">No artists yet.</p>}
          <div className="d-flex flex-wrap gap-3">
            {artists?.map((a) => <ArtistCard key={a.id} artist={a} />)}
          </div>
        </>
      )}

      {creating && (
        <Modal title="New Playlist" onClose={() => setCreating(false)} maxWidth={380}>
          <form onSubmit={handleCreate} className="d-flex gap-2">
            <input
              autoFocus className="form-control mh-input" placeholder="Playlist name"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
            <button type="submit" className="mh-btn-primary px-3" style={{ width: "auto" }}>Create</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
