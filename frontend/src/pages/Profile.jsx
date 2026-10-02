import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, Heart, History, ListMusic } from "lucide-react";

import SongRow from "../components/SongRow";
import PlaylistCard from "../components/PlaylistCard";

import { useAuth } from "../context/AuthContext";
import { getRecentlyPlayed, getLikedSongs, getMyPlaylists } from "../services/music";

const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect width='160' height='160' fill='%231c2028'/%3E%3C/svg%3E";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recentlyPlayed, setRecentlyPlayed] = useState(null);
  const [likedCount, setLikedCount] = useState(null);
  const [playlists, setPlaylists] = useState(null);

  useEffect(() => {
    getRecentlyPlayed().then((r) => setRecentlyPlayed((r.data.results || r.data).slice(0, 5))).catch(() => setRecentlyPlayed([]));
    getLikedSongs().then((r) => setLikedCount((r.data.results || r.data).length)).catch(() => setLikedCount(0));
    getMyPlaylists().then((r) => setPlaylists(r.data.slice(0, 6))).catch(() => setPlaylists([]));
  }, []);

  return (
    <div>
      <div
        className="d-flex flex-column flex-md-row align-items-md-center gap-4 p-4 p-lg-5"
        style={{ background: "linear-gradient(180deg, rgba(124,58,237,0.25), var(--mh-bg))" }}
      >
        <img
          src={user?.avatar || FALLBACK_AVATAR}
          alt={user?.username}
          style={{ width: 140, height: 140, borderRadius: "50%", objectFit: "cover", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
        />
        <div className="flex-grow-1">
          <div className="text-secondary small text-uppercase">Profile</div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "clamp(1.5rem, 4vw, 2.4rem)" }}>{user?.username}</h1>
          <p className="text-secondary mb-1">{user?.email}</p>
          {user?.bio && <p className="text-secondary mb-0" style={{ maxWidth: 480 }}>{user.bio}</p>}
        </div>
        <button
          className="btn d-flex align-items-center gap-2 px-3 align-self-start"
          style={{ background: "var(--mh-surface-raised)", border: "none", color: "var(--mh-text-primary)", borderRadius: "var(--mh-radius-sm)" }}
          onClick={() => navigate("/settings")}
        >
          <SettingsIcon size={16} /> Edit Profile
        </button>
      </div>

      <div className="px-3 px-lg-4 py-4">
        {/* Quick stats */}
        <div className="d-flex gap-3 mb-5 flex-wrap">
          <div
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
            style={{ background: "var(--mh-surface-raised)", cursor: "pointer" }}
            onClick={() => navigate("/liked")}
          >
            <Heart size={18} style={{ color: "var(--mh-accent-2)" }} />
            <span className="small">{likedCount === null ? "..." : likedCount} liked songs</span>
          </div>
          <div
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
            style={{ background: "var(--mh-surface-raised)", cursor: "pointer" }}
            onClick={() => navigate("/playlists")}
          >
            <ListMusic size={18} />
            <span className="small">{playlists === null ? "..." : playlists.length} playlists</span>
          </div>
          <div
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
            style={{ background: "var(--mh-surface-raised)", cursor: "pointer" }}
            onClick={() => navigate("/recently-played")}
          >
            <History size={18} />
            <span className="small">Recently Played</span>
          </div>
        </div>

        {recentlyPlayed?.length > 0 && (
          <div className="mb-5">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="mh-section-title">Recently Played</h2>
              <button className="mh-see-all btn btn-sm p-0" style={{ background: "none", border: "none" }} onClick={() => navigate("/recently-played")}>
                See all
              </button>
            </div>
            <div className="d-flex flex-column gap-1">
              {recentlyPlayed.map((e, i) => <SongRow key={`${e.song.id}-${i}`} song={e.song} index={i + 1} queue={recentlyPlayed.map((x) => x.song)} />)}
            </div>
          </div>
        )}

        {playlists?.length > 0 && (
          <div className="mb-5">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="mh-section-title">Your Playlists</h2>
              <button className="mh-see-all btn btn-sm p-0" style={{ background: "none", border: "none" }} onClick={() => navigate("/playlists")}>
                See all
              </button>
            </div>
            <div className="mh-scroll-row">
              {playlists.map((p) => <PlaylistCard key={p.id} playlist={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
