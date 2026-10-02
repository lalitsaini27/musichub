import { useEffect, useState } from "react";
import { Trash2, Lock, Globe } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import { getAdminPlaylists, deleteAdminPlaylist } from "../../../services/music";

export default function PlaylistsTab() {
  const [playlists, setPlaylists] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => getAdminPlaylists().then((r) => setPlaylists(r.data.results || r.data)).catch(() => setPlaylists([]));
  useEffect(load, []);

  const handleDelete = async () => {
    try {
      await deleteAdminPlaylist(confirmDelete.id);
      toast.success("Playlist deleted.");
      setConfirmDelete(null);
      load();
    } catch {
      toast.error("Couldn't delete that playlist.");
    }
  };

  return (
    <div>
      {playlists === null && <p className="text-secondary small">Loading...</p>}

      <table className="mh-admin-table">
        <thead><tr><th>Title</th><th>Owner</th><th>Visibility</th><th>Songs</th><th></th></tr></thead>
        <tbody>
          {playlists?.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td className="text-secondary">{p.owner_username}</td>
              <td>
                {p.is_public
                  ? <span className="d-flex align-items-center gap-1 text-secondary small"><Globe size={12} /> Public</span>
                  : <span className="d-flex align-items-center gap-1 text-secondary small"><Lock size={12} /> Private</span>}
              </td>
              <td>{p.song_count}</td>
              <td className="text-end">
                <button className="mh-icon-btn" onClick={() => setConfirmDelete(p)}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {playlists?.length === 0 && <p className="text-secondary small">No playlists yet.</p>}

      {confirmDelete && (
        <Modal title={`Delete "${confirmDelete.title}"?`} onClose={() => setConfirmDelete(null)} maxWidth={380}>
          <p className="text-secondary small mb-3">
            This deletes {confirmDelete.owner_username}'s playlist permanently. This can't be undone.
          </p>
          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-sm px-3" style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn-sm px-3" style={{ background: "#e5484d", border: "none", color: "#fff", borderRadius: "var(--mh-radius-sm)" }} onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
