import { useNavigate } from "react-router-dom";
import { ListMusic } from "lucide-react";

export default function PlaylistCard({ playlist }) {
  const navigate = useNavigate();
  return (
    <div
      className="mh-card-hover p-2"
      style={{ borderRadius: "var(--mh-radius-md)", cursor: "pointer", width: 168, flexShrink: 0 }}
      onClick={() => navigate(`/playlist/${playlist.id}`)}
    >
      {playlist.cover_image ? (
        <img
          src={playlist.cover_image}
          alt={playlist.title}
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "var(--mh-radius-sm)" }}
        />
      ) : (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            width: "100%", aspectRatio: "1/1", borderRadius: "var(--mh-radius-sm)",
            background: "var(--mh-accent-gradient)",
          }}
        >
          <ListMusic size={36} color="#0b0d10" />
        </div>
      )}
      <div className="mt-2" style={{ minWidth: 0 }}>
        <div className="text-truncate small fw-semibold">{playlist.title}</div>
        <div className="text-truncate text-secondary" style={{ fontSize: 12 }}>
          By {playlist.owner_username} · {playlist.song_count} songs
        </div>
      </div>
    </div>
  );
}
