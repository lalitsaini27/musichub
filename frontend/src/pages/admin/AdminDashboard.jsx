import { useState } from "react";
import { Music, Disc3, Users2, ListMusic, Tag, Shield } from "lucide-react";

import SongsTab from "./tabs/SongsTab";
import ArtistsTab from "./tabs/ArtistsTab";
import AlbumsTab from "./tabs/AlbumsTab";
import GenresTab from "./tabs/GenresTab";
import PlaylistsTab from "./tabs/PlaylistsTab";
import UsersTab from "./tabs/UsersTab";

const TABS = [
  { key: "songs", label: "Songs", icon: Music, Component: SongsTab },
  { key: "artists", label: "Artists", icon: Users2, Component: ArtistsTab },
  { key: "albums", label: "Albums", icon: Disc3, Component: AlbumsTab },
  { key: "genres", label: "Genres", icon: Tag, Component: GenresTab },
  { key: "playlists", label: "Playlists", icon: ListMusic, Component: PlaylistsTab },
  { key: "users", label: "Users", icon: Shield, Component: UsersTab },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("songs");
  const Active = TABS.find((t) => t.key === tab)?.Component;

  return (
    <div className="px-3 px-lg-4 py-4">
      <h1 className="fw-bold mb-1">Admin Dashboard</h1>
      <p className="text-secondary small mb-4">Manage MusicHub's catalog, playlists, and users.</p>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2"
            style={{
              borderRadius: "var(--mh-radius-sm)", border: "none",
              background: tab === t.key ? "var(--mh-accent-gradient)" : "var(--mh-surface-raised)",
              color: tab === t.key ? "#0b0d10" : "var(--mh-text-primary)",
              fontWeight: tab === t.key ? 600 : 400,
            }}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {Active && <Active />}
    </div>
  );
}
