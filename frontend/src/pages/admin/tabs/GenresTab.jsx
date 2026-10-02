import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import { getGenres, createGenre, deleteGenre } from "../../../services/music";

export default function GenresTab() {
  const [genres, setGenres] = useState(null);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => getGenres().then((r) => setGenres(r.data.results || r.data)).catch(() => setGenres([]));
  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createGenre({ name: name.trim() });
      setName("");
      load();
      toast.success("Genre added.");
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Couldn't add that genre.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGenre(confirmDelete.id);
      setConfirmDelete(null);
      load();
      toast.success("Genre deleted.");
    } catch {
      toast.error("Couldn't delete that genre.");
    }
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="d-flex gap-2 mb-4" style={{ maxWidth: 360 }}>
        <input className="form-control mh-input" placeholder="New genre name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="mh-btn-primary px-3 d-flex align-items-center gap-1" style={{ width: "auto" }}>
          <Plus size={16} /> Add
        </button>
      </form>

      {genres === null && <p className="text-secondary small">Loading...</p>}

      <table className="mh-admin-table">
        <thead><tr><th>Name</th><th>Slug</th><th></th></tr></thead>
        <tbody>
          {genres?.map((g) => (
            <tr key={g.id}>
              <td>{g.name}</td>
              <td className="text-secondary">{g.slug}</td>
              <td className="text-end">
                <button className="mh-icon-btn" onClick={() => setConfirmDelete(g)}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {genres?.length === 0 && <p className="text-secondary small">No genres yet.</p>}

      {confirmDelete && (
        <Modal title={`Delete "${confirmDelete.name}"?`} onClose={() => setConfirmDelete(null)} maxWidth={360}>
          <p className="text-secondary small mb-3">Songs/albums/artists using this genre will keep playing — the genre tag is just removed.</p>
          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-sm px-3" style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn-sm px-3" style={{ background: "#e5484d", border: "none", color: "#fff", borderRadius: "var(--mh-radius-sm)" }} onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
