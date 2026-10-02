import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import { getAlbums, createAlbum, updateAlbum, deleteAlbum, getArtists, getGenres } from "../../../services/music";

const EMPTY = { title: "", artist: "", release_year: new Date().getFullYear(), album_type: "album", genres: [], is_featured: false, is_new_release: false, cover_image: null };

export default function AlbumsTab() {
  const [albums, setAlbums] = useState(null);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => getAlbums().then((r) => setAlbums(r.data.results || r.data)).catch(() => setAlbums([]));
  useEffect(() => {
    load();
    getArtists().then((r) => setArtists(r.data.results || r.data)).catch(() => setArtists([]));
    getGenres().then((r) => setGenres(r.data.results || r.data)).catch(() => setGenres([]));
  }, []);

  const openNew = () => { setForm({ ...EMPTY, artist: artists[0]?.id || "" }); setEditing("new"); };
  const openEdit = (album) => {
    setForm({
      title: album.title, artist: album.artist, release_year: album.release_year,
      album_type: album.album_type, genres: [], is_featured: album.is_featured,
      is_new_release: album.is_new_release, cover_image: null,
    });
    setEditing(album);
  };

  const toggleGenre = (id) => {
    setForm((f) => ({ ...f, genres: f.genres.includes(id) ? f.genres.filter((g) => g !== id) : [...f.genres, id] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("artist", form.artist);
    fd.append("release_year", form.release_year);
    fd.append("album_type", form.album_type);
    fd.append("is_featured", form.is_featured);
    fd.append("is_new_release", form.is_new_release);
    form.genres.forEach((g) => fd.append("genres", g));
    if (form.cover_image) fd.append("cover_image", form.cover_image);

    try {
      if (editing === "new") await createAlbum(fd);
      else await updateAlbum(editing.slug, fd);
      toast.success(editing === "new" ? "Album created." : "Album updated.");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.title?.[0] || "Couldn't save that album.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAlbum(confirmDelete.slug);
      toast.success("Album deleted.");
      setConfirmDelete(null);
      load();
    } catch {
      toast.error("Couldn't delete that album.");
    }
  };

  return (
    <div>
      <button className="mh-btn-primary d-flex align-items-center gap-2 px-3 mb-4" style={{ width: "auto" }} onClick={openNew} disabled={!artists.length}>
        <Plus size={16} /> New Album
      </button>
      {!artists.length && <p className="text-secondary small">Create an artist first before adding albums.</p>}

      {albums === null && <p className="text-secondary small">Loading...</p>}

      <table className="mh-admin-table">
        <thead><tr><th>Title</th><th>Artist</th><th>Year</th><th>Type</th><th>Featured</th><th></th></tr></thead>
        <tbody>
          {albums?.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td className="text-secondary">{a.artist_name}</td>
              <td>{a.release_year}</td>
              <td className="text-capitalize">{a.album_type}</td>
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
        <Modal title={editing === "new" ? "New Album" : `Edit ${editing.title}`} onClose={() => setEditing(null)} maxWidth={460}>
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <input className="form-control mh-input" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="form-select mh-input" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} required>
              {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="d-flex gap-2">
              <input type="number" className="form-control mh-input" placeholder="Release year" value={form.release_year} onChange={(e) => setForm({ ...form, release_year: e.target.value })} />
              <select className="form-select mh-input" value={form.album_type} onChange={(e) => setForm({ ...form, album_type: e.target.value })}>
                <option value="album">Album</option>
                <option value="single">Single</option>
                <option value="ep">EP</option>
              </select>
            </div>
            <div>
              <label className="form-label small text-secondary d-block">Cover Image</label>
              <input type="file" accept="image/*" className="form-control mh-input" onChange={(e) => setForm({ ...form, cover_image: e.target.files[0] })} />
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
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured
              </label>
              <label className="d-flex align-items-center gap-2 small">
                <input type="checkbox" checked={form.is_new_release} onChange={(e) => setForm({ ...form, is_new_release: e.target.checked })} /> New Release
              </label>
            </div>
            <button type="submit" className="mh-btn-primary px-4" style={{ width: "auto" }} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title={`Delete "${confirmDelete.title}"?`} onClose={() => setConfirmDelete(null)} maxWidth={360}>
          <p className="text-secondary small mb-3">This also deletes all songs on this album. This can't be undone.</p>
          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-sm px-3" style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn-sm px-3" style={{ background: "#e5484d", border: "none", color: "#fff", borderRadius: "var(--mh-radius-sm)" }} onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
