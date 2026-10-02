import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, Compass, Search, Library, Heart, ListMusic, History, Plus, Music2, LogOut, ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { createPlaylist } from "../services/music";
import Modal from "../components/Modal";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/liked", label: "Liked Songs", icon: Heart },
  { to: "/playlists", label: "Playlists", icon: ListMusic },
  { to: "/recently-played", label: "Recently Played", icon: History },
];

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const isAdmin = user?.is_staff || user?.is_admin_user;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleCreatePlaylistClick = () => {
    if (!isAuthenticated) {
      toast.info("Log in to create playlists.");
      navigate("/login");
      return;
    }
    setCreating(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { data } = await createPlaylist({ title: title.trim(), is_public: true });
      setCreating(false);
      setTitle("");
      navigate(`/playlist/${data.id}`);
    } catch {
      toast.error("Couldn't create the playlist.");
    }
  };

  return (
    <aside
      className="d-none d-lg-flex flex-column justify-content-between p-3"
      style={{
        width: "var(--mh-sidebar-width)",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        background: "var(--mh-surface)",
        borderRight: "1px solid var(--mh-border)",
      }}
    >
      <div>
        <div className="d-flex align-items-center gap-2 mb-4 px-2">
          <Music2 size={26} style={{ color: "var(--mh-accent-2)" }} />
          <span className="fs-5 fw-bold mh-text-gradient">MusicHub</span>
        </div>

        <nav className="d-flex flex-column gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none ${
                  isActive ? "text-white" : "text-secondary"
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? "var(--mh-surface-raised)" : "transparent",
                fontWeight: isActive ? 600 : 500,
                transition: "background 0.15s ease",
              })}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none ${
                  isActive ? "text-white" : "text-secondary"
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? "var(--mh-surface-raised)" : "transparent",
                fontWeight: isActive ? 600 : 500,
              })}
            >
              <ShieldCheck size={20} />
              <span>Admin Dashboard</span>
            </NavLink>
          )}
        </nav>
      </div>

      <div className="d-flex flex-column gap-2">
        <button
          className="btn d-flex align-items-center justify-content-center gap-2 fw-semibold"
          style={{
            background: "var(--mh-accent-gradient)",
            border: "none",
            borderRadius: "var(--mh-radius-md)",
            color: "#0b0d10",
            padding: "10px 0",
          }}
          onClick={handleCreatePlaylistClick}
        >
          <Plus size={18} /> Create Playlist
        </button>
        {isAuthenticated ? (
          <div className="d-flex align-items-center justify-content-between px-2 py-2 rounded-3 text-secondary">
            <NavLink to="/profile" className="d-flex align-items-center gap-2 text-decoration-none text-secondary" style={{ minWidth: 0 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: "var(--mh-accent-gradient)",
                }}
              />
              <span className="small text-truncate">{user?.username}</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="btn btn-sm p-1 text-secondary"
              title="Log out"
              style={{ background: "none", border: "none" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="d-flex align-items-center gap-2 px-2 py-2 rounded-3 text-secondary text-decoration-none"
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--mh-surface-raised)",
              }}
            />
            <span className="small">Log in</span>
          </NavLink>
        )}
      </div>

      {creating && (
        <Modal title="New Playlist" onClose={() => setCreating(false)} maxWidth={360}>
          <form onSubmit={handleCreate} className="d-flex gap-2">
            <input
              autoFocus className="form-control mh-input" placeholder="Playlist name"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
            <button type="submit" className="mh-btn-primary px-3" style={{ width: "auto" }}>Create</button>
          </form>
        </Modal>
      )}
    </aside>
  );
}
