import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";

import PlaylistCard from "../components/PlaylistCard";
import Modal from "../components/Modal";

import { useAuth } from "../context/AuthContext";
import { getMyPlaylists, createPlaylist } from "../services/music";

export default function Playlists() {
  const { isAuthenticated } = useAuth();
  const [playlists, setPlaylists] = useState(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  const load = () => {
    if (!isAuthenticated) { setPlaylists([]); return; }
    getMyPlaylists().then((r) => setPlaylists(r.data)).catch(() => setPlaylists([]));
  };

  useEffect(load, [isAuthenticated]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createPlaylist({ title: title.trim(), is_public: true });
      toast.success("Playlist created.");
      setTitle("");
      setCreating(false);
      load();
    } catch {
      toast.error("Couldn't create the playlist.");
    }
  };

  return (
    <div className="px-3 px-lg-4 py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="fw-bold mb-0">Your Playlists</h1>
        {isAuthenticated && (
          <button
            className="mh-btn-primary d-flex align-items-center gap-2 px-3"
            style={{ width: "auto" }}
            onClick={() => setCreating(true)}
          >
            <Plus size={16} /> New Playlist
          </button>
        )}
      </div>

      {!isAuthenticated && <p className="text-secondary small">Log in to create and manage playlists.</p>}

      {isAuthenticated && playlists === null && <p className="text-secondary small">Loading...</p>}

      {isAuthenticated && playlists !== null && playlists.length === 0 && (
        <div className="text-center py-5">
          <p className="fw-semibold mb-1">No playlists yet</p>
          <p className="text-secondary small">Create your first playlist to start organizing your music.</p>
        </div>
      )}

      <div className="d-flex flex-wrap gap-3">
        {playlists?.map((p) => <PlaylistCard key={p.id} playlist={p} />)}
      </div>

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
