import { useEffect, useMemo, useRef } from "react";
import { X, Mic2 } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";

// Parses LRC-style lines: "[mm:ss] lyric text" or "[mm:ss.xx] lyric text"
function parseLRC(raw) {
  if (!raw) return [];
  const lineRe = /\[(\d+):(\d{1,2})(?:\.(\d{1,2}))?\]\s*(.*)/;
  return raw
    .split("\n")
    .map((line) => {
      const match = line.match(lineRe);
      if (!match) return null;
      const [, mm, ss, cs, text] = match;
      const time = Number(mm) * 60 + Number(ss) + (cs ? Number(cs) / 100 : 0);
      return { time, text: text.trim() };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}

export default function LiveLyrics({ song, onClose }) {
  const { currentTime, seek } = usePlayer();
  const lines = useMemo(() => parseLRC(song?.lyrics), [song?.lyrics]);
  const activeRef = useRef(null);
  const containerRef = useRef(null);

  const activeIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime) idx = i;
      else break;
    }
    return idx;
  }, [lines, currentTime]);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  return (
    <div
      className="mh-glass d-flex flex-column"
      style={{ borderRadius: "var(--mh-radius-lg)", background: "var(--mh-surface)", maxWidth: 480, margin: "0 auto", maxHeight: 420 }}
    >
      <div className="d-flex align-items-center justify-content-between p-3" style={{ borderBottom: "1px solid var(--mh-border)" }}>
        <div className="d-flex align-items-center gap-2">
          <Mic2 size={16} style={{ color: "var(--mh-accent-2)" }} />
          <div>
            <div className="fw-bold" style={{ fontSize: 14 }}>Live Lyrics</div>
            <div className="text-secondary" style={{ fontSize: 11 }}>{song?.title} • {song?.artist}</div>
          </div>
        </div>
        {onClose && (
          <button className="mh-icon-btn" onClick={onClose} aria-label="Close lyrics"><X size={16} /></button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="text-center text-secondary small p-4">Lyrics aren't available for this track yet.</div>
      ) : (
        <div ref={containerRef} className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3">
          {lines.map((line, i) => (
            <div
              key={i}
              ref={i === activeIndex ? activeRef : null}
              role="button"
              onClick={() => seek(line.time)}
              className="text-center"
              style={{
                cursor: "pointer",
                fontSize: i === activeIndex ? 18 : 15,
                fontWeight: i === activeIndex ? 700 : 400,
                color: i === activeIndex ? "var(--mh-text-primary)" : "var(--mh-text-muted)",
                transition: "all 0.2s ease",
              }}
            >
              {line.text}
            </div>
          ))}
        </div>
      )}

      <div className="text-secondary text-center py-2" style={{ fontSize: 11, borderTop: "1px solid var(--mh-border)" }}>
        {lines.length > 0 ? "Click any line to jump audio" : ""}
      </div>
    </div>
  );
}
