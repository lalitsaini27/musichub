import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, Heart, ListMusic, Mic2, Plus, AudioLines, SlidersHorizontal,
} from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import Queue from "../components/Queue";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import LiveLyrics from "../components/LiveLyrics";
import AudioVisualizer from "../components/AudioVisualizer";
import EqualizerPanel from "../components/EqualizerPanel";

const FALLBACK =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%231c2028'/%3E%3C/svg%3E";

function formatTime(s) {
  if (!s || Number.isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

const PANELS = { NONE: null, QUEUE: "queue", LYRICS: "lyrics", VISUALIZER: "visualizer", EQUALIZER: "equalizer" };

export default function NowPlaying() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    currentSong, isPlaying, currentTime, duration, volume, shuffle, repeat,
    togglePlay, next, previous, seek, setVolume, setShuffle, setRepeat, likedIds, toggleLike,
  } = usePlayer();

  const [panel, setPanel] = useState(PANELS.NONE);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  if (!currentSong) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center px-4" style={{ minHeight: "100vh", background: "var(--mh-bg)" }}>
        <p className="text-secondary mb-3">Nothing's playing right now.</p>
        <button className="mh-btn-primary px-4" style={{ width: "auto" }} onClick={() => navigate("/")}>
          Browse music
        </button>
      </div>
    );
  }

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const isLiked = likedIds.has(currentSong.id);
  const togglePanel = (p) => setPanel((current) => (current === p ? PANELS.NONE : p));

  return (
    <div
      className="d-flex flex-column"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, rgba(124,58,237,0.25), var(--mh-bg) 60%)`,
      }}
    >
      <div className="d-flex align-items-center justify-content-between p-3">
        <button className="btn btn-sm p-1 text-secondary" style={{ background: "none", border: "none" }} onClick={() => navigate(-1)} aria-label="Close now playing">
          <ChevronDown size={24} />
        </button>
        <span className="text-secondary small text-uppercase" style={{ letterSpacing: 1 }}>Now Playing</span>
        <div style={{ width: 24 }} />
      </div>

      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center px-4" style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <img
          src={currentSong.coverUrl || FALLBACK}
          alt={currentSong.title}
          style={{
            width: "min(320px, 72vw)", height: "min(320px, 72vw)", objectFit: "cover",
            borderRadius: "var(--mh-radius-lg)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          }}
        />

        <div className="w-100 d-flex align-items-center justify-content-between mt-4">
          <div className="text-truncate" style={{ maxWidth: "80%" }}>
            <h4 className="fw-bold text-truncate mb-1">{currentSong.title}</h4>
            <div className="text-secondary text-truncate">{currentSong.artist}</div>
          </div>
          {isAuthenticated && (
            <button
              className="btn btn-sm p-1"
              style={{ background: "none", border: "none", color: isLiked ? "var(--mh-accent-2)" : "var(--mh-text-secondary)" }}
              onClick={() => toggleLike(currentSong.id)}
              aria-label={isLiked ? "Unlike song" : "Like song"}
            >
              <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        <div className="w-100 mt-3">
          <input
            type="range" min={0} max={duration || 0} value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="form-range w-100"
          />
          <div className="d-flex justify-content-between text-secondary" style={{ fontSize: 12 }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-4 mt-3">
          <button className={`btn p-1 ${shuffle ? "text-white" : "text-secondary"}`} style={{ background: "none", border: "none" }} onClick={() => setShuffle(!shuffle)} aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}>
            <Shuffle size={20} />
          </button>
          <button className="btn p-1 text-white" style={{ background: "none", border: "none" }} onClick={previous} aria-label="Previous track">
            <SkipBack size={26} />
          </button>
          <button
            className="btn d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 64, height: 64, background: "var(--mh-accent-gradient)", border: "none" }}
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={26} color="#0b0d10" /> : <Play size={26} color="#0b0d10" />}
          </button>
          <button className="btn p-1 text-white" style={{ background: "none", border: "none" }} onClick={next} aria-label="Next track">
            <SkipForward size={26} />
          </button>
          <button
            className={`btn p-1 ${repeat !== "off" ? "text-white" : "text-secondary"}`}
            style={{ background: "none", border: "none" }}
            onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
            aria-label={`Repeat: ${repeat}`}
          >
            <RepeatIcon size={20} />
          </button>
        </div>

        <div className="d-flex align-items-center gap-3 mt-4 w-100 justify-content-center flex-wrap">
          <button
            className={`btn btn-sm d-flex align-items-center gap-1 ${panel === PANELS.LYRICS ? "text-white" : "text-secondary"}`}
            style={{ background: "none", border: "none" }}
            onClick={() => togglePanel(PANELS.LYRICS)}
          >
            <Mic2 size={16} /> Lyrics
          </button>
          <button
            className={`btn btn-sm d-flex align-items-center gap-1 ${panel === PANELS.VISUALIZER ? "text-white" : "text-secondary"}`}
            style={{ background: "none", border: "none" }}
            onClick={() => togglePanel(PANELS.VISUALIZER)}
          >
            <AudioLines size={16} /> Visualizer
          </button>
          <button
            className={`btn btn-sm d-flex align-items-center gap-1 ${panel === PANELS.EQUALIZER ? "text-white" : "text-secondary"}`}
            style={{ background: "none", border: "none" }}
            onClick={() => togglePanel(PANELS.EQUALIZER)}
          >
            <SlidersHorizontal size={16} /> Equalizer
          </button>
          {isAuthenticated && (
            <button
              className="btn btn-sm d-flex align-items-center gap-1 text-secondary"
              style={{ background: "none", border: "none" }}
              onClick={() => setShowAddToPlaylist(true)}
            >
              <Plus size={16} /> Add to Playlist
            </button>
          )}
          <button
            className={`btn btn-sm d-flex align-items-center gap-1 ${panel === PANELS.QUEUE ? "text-white" : "text-secondary"}`}
            style={{ background: "none", border: "none" }}
            onClick={() => togglePanel(PANELS.QUEUE)}
          >
            <ListMusic size={16} /> Queue
          </button>
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 120 }}>
            <VolumeIcon size={16} className="text-secondary" />
            <input
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="form-range" style={{ width: 90 }}
            />
          </div>
        </div>

        {panel === PANELS.LYRICS && (
          <div className="w-100 mt-4">
            <LiveLyrics song={currentSong} onClose={() => setPanel(PANELS.NONE)} />
          </div>
        )}
        {panel === PANELS.VISUALIZER && (
          <div className="w-100 mt-4">
            <AudioVisualizer onClose={() => setPanel(PANELS.NONE)} />
          </div>
        )}
        {panel === PANELS.EQUALIZER && (
          <div className="w-100 mt-4">
            <EqualizerPanel onClose={() => setPanel(PANELS.NONE)} />
          </div>
        )}
      </div>

      {panel === PANELS.QUEUE && <Queue onClose={() => setPanel(PANELS.NONE)} />}
      {showAddToPlaylist && <AddToPlaylistModal song={currentSong} onClose={() => setShowAddToPlaylist(false)} />}
    </div>
  );
}
