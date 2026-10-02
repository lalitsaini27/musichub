import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star, TrendingUp } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import { getSongs, createSong, updateSong, deleteSong, getArtists, getAlbums } from "../../../services/music";

const EMPTY = {
  title: "", artist: "", album: "", track_number: 1, duration_seconds: 180,
  audio_url: "", audio_file: null, cover_image: null, lyrics: "", is_featured: false, is_trending: false,
};

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SongsTab() {
  const [songs, setSongs] = useState(null);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => getSongs().then((r) => setSongs(r.data.results || r.data)).catch(() => setSongs([]));
  useEffect(() => {
    load();
    getArtists().then((r) => setArtists(r.data.results || r.data)).catch(() => setArtists([]));
    getAlbums().then((r) => setAlbums(r.data.results || r.data)).catch(() => setAlbums([]));
  }, []);

  const openNew = () => { setForm({ ...EMPTY, artist: artists[0]?.id || "" }); setEditing("new"); };
  const openEdit = (song) => {
    setForm({
      title: song.title, artist: song.artist_id, album: song.album || "",
      track_number: song.track_number || 1, duration_seconds: song.duration_seconds,
      audio_url: song.audio_url && !song.audio_url.startsWith("http://127") ? song.audio_url : "",
      audio_file: null, cover_image: null, lyrics: song.lyrics || "", is_featured: song.is_featured, is_trending: song.is_trending,
    });
    setEditing(song);
  };

  const artistAlbums = albums.filter((a) => String(a.artist) === String(form.artist));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("artist", form.artist);
    if (form.album) fd.append("album", form.album);
    fd.append("track_number", form.track_number);
    fd.append("duration_seconds", form.duration_seconds);
    if (form.audio_url) fd.append("audio_url", form.audio_url);
    if (form.audio_file) fd.append("audio_file", form.audio_file);
    if (form.cover_image) fd.append("cover_image", form.cover_image);
    fd.append("lyrics", form.lyrics);
    fd.append("is_featured", form.is_featured);
    fd.append("is_trending", form.is_trending);

    try {
      if (editing === "new") await createSong(fd);
      else await updateSong(editing.id, fd);
      toast.success(editing === "new" ? "Song created." : "Song updated.");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.title?.[0] || "Couldn't save that song.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSong(confirmDelete.id);
      toast.success("Song deleted.");
      setConfirmDelete(null);
      load();
    } catch {
      toast.error("Couldn't delete that song.");
    }
  };

  return (
    <div>
      <button className="mh-btn-primary d-flex align-items-center gap-2 px-3 mb-4" style={{ width: "auto" }} onClick={openNew} disabled={!artists.length}>
        <Plus size={16} /> New Song
      </button>
      {!artists.length && <p className="text-secondary small">Create an artist first before adding songs.</p>}

      {songs === null && <p className="text-secondary small">Loading...</p>}

      <table className="mh-admin-table">
        <thead><tr><th>Title</th><th>Artist</th><th>Album</th><th>Duration</th><th>Plays</th><th></th></tr></thead>
        <tbody>
          {songs?.map((s) => (
            <tr key={s.id}>
              <td>
                {s.title}{" "}
                {s.is_featured && <Star size={12} fill="currentColor" style={{ color: "var(--mh-accent-2)" }} className="ms-1" />}
                {s.is_trending && <TrendingUp size={12} style={{ color: "var(--mh-accent-2)" }} className="ms-1" />}
              </td>
              <td className="text-secondary">{s.artist_name}</td>
              <td className="text-secondary">{s.album_title || "—"}</td>
              <td>{formatDuration(s.duration_seconds)}</td>
              <td>{s.play_count.toLocaleString()}</td>
              <td className="text-end">
                <button className="mh-icon-btn" onClick={() => openEdit(s)}><Pencil size={15} /></button>
                <button className="mh-icon-btn" onClick={() => setConfirmDelete(s)}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing === "new" ? "New Song" : `Edit ${editing.title}`} onClose={() => setEditing(null)} maxWidth={480}>
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <input className="form-control mh-input" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="d-flex gap-2">
              <select className="form-select mh-input" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value, album: "" })} required>
                {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select className="form-select mh-input" value={form.album} onChange={(e) => setForm({ ...form, album: e.target.value })}>
                <option value="">No album (single)</option>
                {artistAlbums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
            <div className="d-flex gap-2">
              <input type="number" min={1} className="form-control mh-input" placeholder="Track #" value={form.track_number} onChange={(e) => setForm({ ...form, track_number: e.target.value })} />
              <input type="number" min={1} className="form-control mh-input" placeholder="Duration (seconds)" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })} />
            </div>
            <div>
              <label className="form-label small text-secondary d-block">Audio URL (royalty-free / placeholder)</label>
              <input className="form-control mh-input" placeholder="https://..." value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} />
            </div>
            <div>
              <label className="form-label small text-secondary d-block">Or upload an audio file</label>
              <input type="file" accept="audio/*" className="form-control mh-input" onChange={(e) => setForm({ ...form, audio_file: e.target.files[0] })} />
            </div>
            <div>
              <label className="form-label small text-secondary d-block">Cover Image (optional — falls back to album cover)</label>
              <input type="file" accept="image/*" className="form-control mh-input" onChange={(e) => setForm({ ...form, cover_image: e.target.files[0] })} />
            </div>
            <div>
              <label className="form-label small text-secondary d-block">
                Lyrics (optional — LRC format, one line per row: <code>[mm:ss] lyric text</code>)
              </label>
              <textarea
                className="form-control mh-input" rows={4}
                placeholder={"[0:05] Yeah... I've been tryna call\n[0:12] I've been on my own for long enough"}
                value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
              />
            </div>
            <div className="d-flex gap-3">
              <label className="d-flex align-items-center gap-2 small">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured
              </label>
              <label className="d-flex align-items-center gap-2 small">
                <input type="checkbox" checked={form.is_trending} onChange={(e) => setForm({ ...form, is_trending: e.target.checked })} /> Trending
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
          <p className="text-secondary small mb-3">This removes the song from every playlist and liked-songs list too. This can't be undone.</p>
          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-sm px-3" style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }} onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn-sm px-3" style={{ background: "#e5484d", border: "none", color: "#fff", borderRadius: "var(--mh-radius-sm)" }} onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
