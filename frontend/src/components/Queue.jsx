import { X, Play, Pause } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%231c2028'/%3E%3C/svg%3E";

export default function Queue({ onClose }) {
  const { queue, currentIndex, isPlaying, jumpTo, togglePlay } = usePlayer();

  return (
    <div
      className="position-fixed top-0 end-0 bottom-0 mh-glass d-flex flex-column"
      style={{ width: 340, maxWidth: "100%", background: "var(--mh-surface)", zIndex: 900 }}
    >
      <div className="d-flex align-items-center justify-content-between p-3" style={{ borderBottom: "1px solid var(--mh-border)" }}>
        <h6 className="fw-bold mb-0">Queue</h6>
        <button className="btn btn-sm p-1 text-secondary" style={{ background: "none", border: "none" }} onClick={onClose} aria-label="Close queue">
          <X size={18} />
        </button>
      </div>
      <div className="flex-grow-1 overflow-auto p-2">
        {queue.length === 0 && <p className="text-secondary small px-2">Queue is empty.</p>}
        {queue.map((song, i) => {
          const active = i === currentIndex;
          return (
            <div
              key={`${song.id}-${i}`}
              className="d-flex align-items-center gap-2 p-2 rounded-3"
              style={{ cursor: "pointer", background: active ? "var(--mh-surface-raised)" : "transparent" }}
              onClick={() => (active ? togglePlay() : jumpTo(i))}
            >
              <div className="position-relative" style={{ width: 44, height: 44, flexShrink: 0 }}>
                <img src={song.coverUrl || FALLBACK} alt={song.title} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />
                {active && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: "rgba(0,0,0,0.4)", borderRadius: 6 }}>
                    {isPlaying ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}
                  </div>
                )}
              </div>
              <div className="text-truncate">
                <div className="text-truncate small fw-semibold" style={{ color: active ? "var(--mh-accent-2)" : undefined }}>{song.title}</div>
                <div className="text-truncate text-secondary" style={{ fontSize: 12 }}>{song.artist}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
