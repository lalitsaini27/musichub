import { useEffect, useState } from "react";
import { Plus, Check } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "./Modal";
import { getMyPlaylists, createPlaylist, addSongToPlaylist } from "../services/music";

export default function AddToPlaylistModal({ song, onClose }) {
  const [playlists, setPlaylists] = useState(null);
  const [addedTo, setAddedTo] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    getMyPlaylists().then((r) => setPlaylists(r.data)).catch(() => setPlaylists([]));
  }, []);

  const handleAdd = async (playlist) => {
    try {
      await addSongToPlaylist(playlist.id, song.id);
      setAddedTo((prev) => new Set(prev).add(playlist.id));
      toast.success(`Added to ${playlist.title}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Couldn't add that song.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const { data: playlist } = await createPlaylist({ title: newTitle.trim(), is_public: true });
      await addSongToPlaylist(playlist.id, song.id);
      setPlaylists((prev) => [playlist, ...(prev || [])]);
      setAddedTo((prev) => new Set(prev).add(playlist.id));
      setNewTitle("");
      setCreating(false);
      toast.success(`Created "${playlist.title}" and added the song`);
    } catch {
      toast.error("Couldn't create the playlist.");
    }
  };

  return (
    <Modal title={`Add "${song.title}" to playlist`} onClose={onClose}>
      {creating ? (
        <form onSubmit={handleCreate} className="d-flex gap-2 mb-3">
          <input
            autoFocus
            className="form-control mh-input"
            placeholder="Playlist name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit" className="mh-btn-primary px-3" style={{ width: "auto" }}>Create</button>
        </form>
      ) : (
        <button
          className="d-flex align-items-center gap-2 btn w-100 mb-3 text-start"
          style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }}
          onClick={() => setCreating(true)}
        >
          <Plus size={16} /> New Playlist
        </button>
      )}

      <div style={{ maxHeight: 280, overflowY: "auto" }} className="d-flex flex-column gap-1">
        {playlists === null && <p className="text-secondary small">Loading your playlists...</p>}
        {playlists && playlists.length === 0 && (
          <p className="text-secondary small">You don't have any playlists yet — create one above.</p>
        )}
        {playlists && playlists.map((p) => (
          <button
            key={p.id}
            className="d-flex align-items-center justify-content-between btn text-start px-2 py-2"
            style={{ background: "transparent", border: "none", color: "var(--mh-text-primary)" }}
            onClick={() => handleAdd(p)}
          >
            <span className="text-truncate">{p.title}</span>
            {addedTo.has(p.id) && <Check size={16} style={{ color: "var(--mh-accent-2)" }} />}
          </button>
        ))}
      </div>
    </Modal>
  );
}
