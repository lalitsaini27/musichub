import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, UserX, UserCheck, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import { useAuth } from "../../../context/AuthContext";
import { getAdminUsers, updateAdminUser, deleteAdminUser } from "../../../services/music";

export default function UsersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => getAdminUsers().then((r) => setUsers(r.data.results || r.data)).catch(() => setUsers([]));
  useEffect(load, []);

  const toggleField = async (u, field) => {
    try {
      const { data } = await updateAdminUser(u.id, { [field]: !u[field] });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? data : x)));
    } catch {
      toast.error("Couldn't update that user.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAdminUser(confirmDelete.id);
      toast.success("User deleted.");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Couldn't delete that user.");
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      {users === null && <p className="text-secondary small">Loading...</p>}

      <table className="mh-admin-table">
        <thead><tr><th>Username</th><th>Email</th><th>Status</th><th>Admin</th><th>Staff</th><th></th></tr></thead>
        <tbody>
          {users?.map((u) => (
            <tr key={u.id}>
              <td>{u.username}{u.id === me?.id && <span className="text-secondary"> (you)</span>}</td>
              <td className="text-secondary">{u.email}</td>
              <td>
                <span className="mh-badge" style={{ background: u.is_active ? "rgba(34,211,238,0.15)" : "rgba(229,72,77,0.15)", color: u.is_active ? "var(--mh-accent-2)" : "#e5484d" }}>
                  {u.is_active ? "Active" : "Deactivated"}
                </span>
              </td>
              <td>
                <button className="mh-icon-btn" title={u.is_admin_user ? "Revoke admin" : "Grant admin"} onClick={() => toggleField(u, "is_admin_user")} disabled={u.id === me?.id}>
                  {u.is_admin_user ? <ShieldCheck size={16} style={{ color: "var(--mh-accent-2)" }} /> : <ShieldOff size={16} />}
                </button>
              </td>
              <td className="text-secondary small">{u.is_staff ? "Yes" : "—"}</td>
              <td className="text-end d-flex gap-1 justify-content-end">
                <button className="mh-icon-btn" title={u.is_active ? "Deactivate" : "Activate"} onClick={() => toggleField(u, "is_active")} disabled={u.id === me?.id}>
                  {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                </button>
                <button className="mh-icon-btn" onClick={() => setConfirmDelete(u)} disabled={u.id === me?.id}>
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-secondary small mt-2">
        Staff status can only be changed from the Django admin — this panel only controls the MusicHub admin flag.
      </p>

      {confirmDelete && (
        <Modal title={`Delete account "${confirmDelete.username}"?`} onClose={() => setConfirmDelete(null)} maxWidth={380}>
          <p className="text-secondary small mb-3">
            This permanently deletes their account, playlists, and history. This can't be undone.
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
