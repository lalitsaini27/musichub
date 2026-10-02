import { X, Moon } from "lucide-react";
import { usePlayer, EQ_BANDS, EQ_PRESETS } from "../context/PlayerContext";

const SLEEP_OPTIONS = [15, 30, 45, 60];

function formatRemaining(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}m ${s}s`;
}

export default function EqualizerPanel({ onClose }) {
  const { eqGains, eqPresetName, setEqGain, applyEqPreset, sleepRemaining, startSleepTimer, cancelSleepTimer } = usePlayer();

  return (
    <div
      className="mh-glass p-4"
      style={{ borderRadius: "var(--mh-radius-lg)", background: "var(--mh-surface)", maxWidth: 560, margin: "0 auto" }}
    >
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="fw-bold">Audio Equalizer &amp; Sleep Timer</div>
          <div className="text-secondary" style={{ fontSize: 12 }}>5-Band Studio EQ &amp; Auto-Pause Timer</div>
        </div>
        {onClose && (
          <button className="mh-icon-btn" onClick={onClose} aria-label="Close equalizer"><X size={16} /></button>
        )}
      </div>

      <div className="text-secondary text-uppercase mb-2" style={{ fontSize: 11, letterSpacing: 0.5 }}>Sound Presets</div>
      <div className="d-flex flex-wrap gap-2 mb-4">
        {Object.keys(EQ_PRESETS).map((name) => (
          <button
            key={name} onClick={() => applyEqPreset(name)}
            className="btn btn-sm px-3 py-1"
            style={{
              borderRadius: 999, border: "none", fontSize: 12,
              background: eqPresetName === name ? "var(--mh-accent-gradient)" : "var(--mh-surface-raised)",
              color: eqPresetName === name ? "#0b0d10" : "var(--mh-text-primary)",
              fontWeight: eqPresetName === name ? 600 : 400,
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Band sliders */}
      <div className="d-flex justify-content-between mb-1">
        <span className="text-secondary" style={{ fontSize: 11 }}>+12 dB</span>
        <span className="fw-semibold" style={{ fontSize: 12, color: "var(--mh-accent-2)" }}>{eqPresetName}</span>
        <span className="text-secondary" style={{ fontSize: 11 }}>-12 dB</span>
      </div>
      <div className="d-flex justify-content-between gap-2 mb-4" style={{ height: 160 }}>
        {EQ_BANDS.map((band, i) => (
          <div key={band.freq} className="d-flex flex-column align-items-center flex-grow-1">
            <span className="text-secondary mb-1" style={{ fontSize: 10 }}>
              {eqGains[i] > 0 ? "+" : ""}{eqGains[i]} dB
            </span>
            <input
              type="range" min={-12} max={12} step={1} value={eqGains[i]}
              onChange={(e) => setEqGain(i, Number(e.target.value))}
              style={{
                writingMode: "vertical-lr", direction: "rtl",
                width: 6, height: 100, accentColor: "var(--mh-accent-2)",
              }}
              aria-label={`${band.label} gain`}
            />
            <span className="text-secondary mt-1 text-center" style={{ fontSize: 10 }}>
              {band.freq >= 1000 ? `${band.freq / 1000}kHz` : `${band.freq}Hz`}
            </span>
            <span className="text-secondary text-center" style={{ fontSize: 9 }}>{band.label.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <hr style={{ borderColor: "var(--mh-border)" }} />

      {/* Sleep timer */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <Moon size={14} style={{ color: "var(--mh-accent-1)" }} />
          <span className="text-secondary text-uppercase" style={{ fontSize: 11, letterSpacing: 0.5 }}>Sleep Timer</span>
        </div>
        {sleepRemaining > 0 && (
          <span className="small" style={{ color: "var(--mh-accent-2)" }}>
            Auto-stops in {formatRemaining(sleepRemaining)}
          </span>
        )}
      </div>
      <div className="d-flex flex-wrap gap-2">
        {SLEEP_OPTIONS.map((min) => (
          <button
            key={min} onClick={() => startSleepTimer(min)}
            className="btn btn-sm px-3 py-1"
            style={{
              borderRadius: 999, fontSize: 12,
              border: sleepRemaining > 0 && Math.ceil(sleepRemaining / 60) === min ? "1px solid var(--mh-accent-2)" : "1px solid var(--mh-border)",
              background: "var(--mh-surface-raised)", color: "var(--mh-text-primary)",
            }}
          >
            {min} min
          </button>
        ))}
        {sleepRemaining > 0 && (
          <button
            onClick={cancelSleepTimer}
            className="btn btn-sm px-3 py-1"
            style={{ borderRadius: 999, fontSize: 12, border: "none", background: "rgba(229,72,77,0.15)", color: "#e5484d" }}
          >
            Turn Off Timer
          </button>
        )}
      </div>
    </div>
  );
}
