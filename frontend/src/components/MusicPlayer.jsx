import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Heart, ListMusic, Mic2, AudioLines, SlidersHorizontal,
} from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import Queue from "./Queue";
import LiveLyrics from "./LiveLyrics";
import AudioVisualizer from "./AudioVisualizer";
import EqualizerPanel from "./EqualizerPanel";

function formatTime(s) {
  if (!s || Number.isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

const PANELS = { NONE: null, QUEUE: "queue", LYRICS: "lyrics", VISUALIZER: "visualizer", EQUALIZER: "equalizer" };

export default function MusicPlayer() {
  const navigate = useNavigate();
  const {
    currentSong, isPlaying, currentTime, duration, volume, shuffle, repeat,
    togglePlay, next, previous, seek, setVolume, setShuffle, setRepeat,
    likedIds, toggleLike,
  } = usePlayer();

  const [panel, setPanel] = useState(PANELS.NONE);
  const togglePanel = (p) => setPanel((current) => (current === p ? PANELS.NONE : p));

  if (!currentSong) {
    return (
      <div
        className="mh-player-bar position-fixed bottom-0 end-0 d-flex align-items-center justify-content-center text-secondary small"
        style={{
          height: "var(--mh-player-height)",
          background: "var(--mh-surface)",
          borderTop: "1px solid var(--mh-border)",
          zIndex: 50,
        }}
      >
        No track playing — pick a song to start listening
      </div>
    );
  }

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <>
      {/* Floating panels — anchored above the player bar, usable from any page */}
      {panel && panel !== PANELS.QUEUE && (
        <div
          className="position-fixed d-none d-lg-block"
          style={{
            bottom: "calc(var(--mh-player-height) + 16px)", right: 24, zIndex: 60,
            width: 420, maxHeight: "70vh", overflowY: "auto",
          }}
        >
          {panel === PANELS.LYRICS && <LiveLyrics song={currentSong} onClose={() => setPanel(PANELS.NONE)} />}
          {panel === PANELS.VISUALIZER && <AudioVisualizer onClose={() => setPanel(PANELS.NONE)} />}
          {panel === PANELS.EQUALIZER && <EqualizerPanel onClose={() => setPanel(PANELS.NONE)} />}
        </div>
      )}
      {panel === PANELS.QUEUE && <Queue onClose={() => setPanel(PANELS.NONE)} />}

      <div
        className="mh-player-bar position-fixed bottom-0 end-0 d-flex align-items-center justify-content-between px-3 px-lg-4"
        style={{
          height: "var(--mh-player-height)",
          background: "var(--mh-surface)",
          borderTop: "1px solid var(--mh-border)",
          zIndex: 50,
        }}
        onClick={() => window.innerWidth < 992 && navigate("/now-playing")}
      >
        {/* Track info */}
        <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: "1 1 220px" }}>
          <img
            src={currentSong.coverUrl}
            alt={currentSong.title}
            style={{ width: 52, height: 52, borderRadius: "var(--mh-radius-sm)", objectFit: "cover", cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); navigate("/now-playing"); }}
          />
          <div style={{ minWidth: 0 }}>
            <div className="text-truncate fw-semibold" style={{ maxWidth: 180 }}>{currentSong.title}</div>
            <div className="text-truncate text-secondary small" style={{ maxWidth: 180 }}>{currentSong.artist}</div>
          </div>
          <button
            className="btn btn-sm d-none d-lg-block"
            style={{ color: likedIds.has(currentSong.id) ? "var(--mh-accent-2)" : undefined }}
            onClick={(e) => { e.stopPropagation(); toggleLike(currentSong.id); }}
            aria-label={likedIds.has(currentSong.id) ? "Unlike song" : "Like song"}
          >
            <Heart size={16} fill={likedIds.has(currentSong.id) ? "currentColor" : "none"} className={likedIds.has(currentSong.id) ? "" : "text-secondary"} />
          </button>
        </div>

        {/* Controls — desktop */}
        <div className="d-none d-lg-flex flex-column align-items-center flex-grow-1" style={{ maxWidth: 520 }}>
          <div className="d-flex align-items-center gap-3">
            <button className={`btn btn-sm ${shuffle ? "text-white" : "text-secondary"}`} onClick={(e) => { e.stopPropagation(); setShuffle(!shuffle); }} aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}>
              <Shuffle size={16} />
            </button>
            <button className="btn btn-sm text-white" onClick={(e) => { e.stopPropagation(); previous(); }} aria-label="Previous track"><SkipBack size={18} /></button>
            <button
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 36, height: 36, background: "var(--mh-accent-gradient)" }}
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={16} color="#0b0d10" /> : <Play size={16} color="#0b0d10" />}
            </button>
            <button className="btn btn-sm text-white" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next track"><SkipForward size={18} /></button>
            <button
              className={`btn btn-sm ${repeat !== "off" ? "text-white" : "text-secondary"}`}
              onClick={(e) => { e.stopPropagation(); setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off"); }}
              aria-label={`Repeat: ${repeat}`}
            >
              <RepeatIcon size={16} />
            </button>
          </div>
          <div className="d-flex align-items-center gap-2 w-100 mt-1">
            <span className="text-secondary" style={{ fontSize: 11 }}>{formatTime(currentTime)}</span>
            <input
              type="range" min={0} max={duration || 0} value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="form-range flex-grow-1"
            />
            <span className="text-secondary" style={{ fontSize: 11 }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mobile play/pause only */}
        <button
          className="btn btn-sm rounded-circle d-flex d-lg-none align-items-center justify-content-center"
          style={{ width: 40, height: 40, background: "var(--mh-accent-gradient)" }}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={18} color="#0b0d10" /> : <Play size={18} color="#0b0d10" />}
        </button>

        {/* Extras / volume — desktop */}
        <div className="d-none d-lg-flex align-items-center gap-1" style={{ flex: "1 1 220px", justifyContent: "flex-end" }}>
          <button
            className={`btn btn-sm ${panel === PANELS.LYRICS ? "text-white" : "text-secondary"}`}
            onClick={(e) => { e.stopPropagation(); togglePanel(PANELS.LYRICS); }}
            aria-label="Toggle live lyrics" title="Live Lyrics"
          >
            <Mic2 size={16} />
          </button>
          <button
            className={`btn btn-sm ${panel === PANELS.VISUALIZER ? "text-white" : "text-secondary"}`}
            onClick={(e) => { e.stopPropagation(); togglePanel(PANELS.VISUALIZER); }}
            aria-label="Toggle audio visualizer" title="Audio Visualizer"
          >
            <AudioLines size={16} />
          </button>
          <button
            className={`btn btn-sm ${panel === PANELS.EQUALIZER ? "text-white" : "text-secondary"}`}
            onClick={(e) => { e.stopPropagation(); togglePanel(PANELS.EQUALIZER); }}
            aria-label="Toggle equalizer and sleep timer" title="Equalizer & Sleep Timer"
          >
            <SlidersHorizontal size={16} />
          </button>
          <button
            className={`btn btn-sm ${panel === PANELS.QUEUE ? "text-white" : "text-secondary"}`}
            onClick={(e) => { e.stopPropagation(); togglePanel(PANELS.QUEUE); }}
            aria-label="Toggle queue" title="Queue"
          >
            <ListMusic size={16} />
          </button>
          <Volume2 size={16} className="text-secondary ms-1" />
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="form-range" style={{ width: 80 }}
          />
        </div>
      </div>
    </>
  );
}
