import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BadgeCheck, Star } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import { getArtists, createArtist, updateArtist, deleteArtist, getGenres } from "../../../services/music";

const EMPTY = { name: "", bio: "", verified: false, monthly_listeners: 0, is_featured: false, genres: [], image: null };

export default function ArtistsTab() {
  const [artists, setArtists] = useState(null);
  const [genres, setGenres] = useState([]);
  const [editing, setEditing] = useState(null); // artist object or 'new' or null
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => getArtists().then((r) => setArtists(r.data.results || r.data)).catch(() => setArtists([]));
  useEffect(() => {
    load();
    getGenres().then((r) => setGenres(r.data.results || r.data)).catch(() => setGenres([]));
  }, []);

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (artist) => {
    setForm({
      name: artist.name, bio: "", verified: artist.verified, monthly_listeners: artist.monthly_listeners,
      is_featured: artist.is_featured, genres: [], image: null,
    });
    setEditing(artist);
  };

  const toggleGenre = (id) => {
    setForm((f) => ({
      ...f, genres: f.genres.includes(id) ? f.genres.filter((g) => g !== id) : [...f.genres, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("bio", form.bio);
    fd.append("verified", form.verified);
    fd.append("monthly_listeners", form.monthly_listeners);
    fd.append("is_featured", form.is_featured);
    form.genres.forEach((g) => fd.append("genres", g));
    if (form.image) fd.append("image", form.image);

    try {
      if (editing === "new") await createArtist(fd);
      else await updateArtist(editing.slug, fd);
      toast.success(editing === "new" ? "Artist created." : "Artist updated.");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || "Couldn't save that artist.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteArtist(confirmDelete.slug);
      toast.success("Artist deleted.");
      setConfirmDelete(null);
      load();
    } catch {
      toast.error("Couldn't delete that artist.");
    }
  };

  return (
    <div>
      <button className="mh-btn-primary d-flex align-items-center gap-2 px-3 mb-4" style={{ width: "auto" }} onClick={openNew}>
        <Plus size={16} /> New Artist
      </button>

      {artists === null && <p className="text-secondary small">Loading...</p>}

      <table className="mh-admin-table">
        <thead><tr><th>Name</th><th>Listeners</th><th>Verified</th><th>Featured</th><th></th></tr></thead>
        <tbody>
          {artists?.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.monthly_listeners.toLocaleString()}</td>
              <td>{a.verified && <BadgeCheck size={14} style={{ color: "var(--mh-accent-2)" }} />}</td>
              <td>{a.is_featured && <Star size={14} fill="currentColor" style={{ color: "var(--mh-accent-2)" }} />}</td>
              <td className="text-end">
                <button className="mh-icon-btn" onClick={() => openEdit(a)}><Pencil size={15} /></button>
                <button className="mh-icon-btn" onClick={() => setConfirmDelete(a)}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing === "new" ? "New Artist" : `Edit ${editing.name}`} onClose={() => setEditing(null)} maxWidth={460}>
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <input className="form-control mh-input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea className="form-control mh-input" placeholder="Bio" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <div className="d-flex gap-2">
              <input type="number" min={0} className="form-control mh-input" placeholder="Monthly listeners" value={form.monthly_listeners} onChange={(e) => setForm({ ...form, monthly_listeners: e.target.value })} />
            </div>
            <div>
              <label className="form-label small text-secondary d-block">Profile Image</label>
              <input type="file" accept="image/*" className="form-control mh-input" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
            </div>
            <div className="d-flex flex-wrap gap-2">
              {genres.map((g) => (
                <button
                  type="button" key={g.id} onClick={() => toggleGenre(g.id)}
                  className="btn btn-sm px-2 py-1"
                  style={{
                    borderRadius: 999, border: "none", fontSize: 12,
                    background: form.genres.includes(g.id) ? "var(--mh-accent-gradient)" : "var(--mh-surface-raised)",
                    color: form.genres.includes(g.id) ? "#0b0d10" : "var(--mh-text-primary)",
                  }}
                >
                  {g.name}
                </button>
              ))}
            </div>
            <div className="d-flex gap-3">
              <label className="d-flex align-items-center gap-2 small">
                <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} /> Verified
              </label>
              <label className="d-flex align-items-center gap-2 small">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured
              </label>
            </div>
            <button type="submit" className="mh-btn-primary px-4" style={{ width: "auto" }} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title={`Delete "${confirmDelete.name}"?`} onClose={() => setConfirmDelete(null)} maxWidth={360}>
          <p className="text-secondary small mb-3">This also deletes their albums and songs. This can't be undone.</p>
          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-sm px-3" style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn-sm px-3" style={{ background: "#e5484d", border: "none", color: "#fff", borderRadius: "var(--mh-radius-sm)" }} onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
