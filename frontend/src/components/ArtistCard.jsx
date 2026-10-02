import { useNavigate } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%231c2028'/%3E%3C/svg%3E";

function formatListeners(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M monthly listeners`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K monthly listeners`;
  return `${n} monthly listeners`;
}

export default function ArtistCard({ artist }) {
  const navigate = useNavigate();
  return (
    <div
      className="mh-card-hover text-center p-3"
      style={{ borderRadius: "var(--mh-radius-md)", cursor: "pointer", width: 168, flexShrink: 0 }}
      onClick={() => navigate(`/artist/${artist.slug}`)}
    >
      <img
        src={artist.image || FALLBACK}
        alt={artist.name}
        style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "50%" }}
      />
      <div className="mt-2 d-flex align-items-center justify-content-center gap-1">
        <span className="text-truncate small fw-semibold">{artist.name}</span>
        {artist.verified && <BadgeCheck size={14} style={{ color: "var(--mh-accent-2)" }} />}
      </div>
      <div className="text-secondary text-truncate" style={{ fontSize: 11 }}>
        {formatListeners(artist.monthly_listeners)}
      </div>
    </div>
  );
}
