import { useEffect, useRef, useState } from "react";
import { X, Maximize2 } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";

const MODES = ["Bars", "Wave", "Circular", "Particles"];

// A small pool of particles reused across frames (avoids per-frame allocation).
function makeParticles(n) {
  return Array.from({ length: n }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 40 + Math.random() * 20,
    speed: 0.2 + Math.random() * 0.6,
    size: 1 + Math.random() * 2,
  }));
}

export default function AudioVisualizer({ onClose }) {
  const { analyserRef, isPlaying } = usePlayer();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef(makeParticles(60));
  const [mode, setMode] = useState("Bars");
  const [sensitivity, setSensitivity] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;

    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const timeData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const styles = getComputedStyle(document.documentElement);
    const accent1 = styles.getPropertyValue("--mh-accent-1").trim() || "#7c3aed";
    const accent2 = styles.getPropertyValue("--mh-accent-2").trim() || "#22d3ee";

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!analyser) {
        // No Web Audio graph available (e.g. blocked by the browser) — show a flat idle line.
        ctx.strokeStyle = accent2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }

      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      if (mode === "Bars") {
        const barCount = 48;
        const barWidth = w / barCount;
        for (let i = 0; i < barCount; i++) {
          const v = (freqData[Math.floor((i / barCount) * freqData.length)] / 255) * sensitivity;
          const barHeight = Math.max(4, v * h * 0.9);
          const grad = ctx.createLinearGradient(0, h, 0, h - barHeight);
          grad.addColorStop(0, accent1);
          grad.addColorStop(1, accent2);
          ctx.fillStyle = grad;
          ctx.fillRect(i * barWidth + 1, h - barHeight, barWidth - 2, barHeight);
        }
      } else if (mode === "Wave") {
        ctx.strokeStyle = accent2;
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.beginPath();
        const slice = w / timeData.length;
        for (let i = 0; i < timeData.length; i++) {
          const v = ((timeData[i] - 128) / 128) * sensitivity;
          const y = h / 2 + v * h * 0.4;
          i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * slice, y);
        }
        ctx.stroke();
      } else if (mode === "Circular") {
        const cx = w / 2, cy = h / 2;
        const baseRadius = Math.min(w, h) * 0.2;
        const bars = 64;
        for (let i = 0; i < bars; i++) {
          const v = (freqData[Math.floor((i / bars) * freqData.length)] / 255) * sensitivity;
          const len = baseRadius * 0.6 * v + 4;
          const angle = (i / bars) * Math.PI * 2;
          const x1 = cx + Math.cos(angle) * baseRadius;
          const y1 = cy + Math.sin(angle) * baseRadius;
          const x2 = cx + Math.cos(angle) * (baseRadius + len);
          const y2 = cy + Math.sin(angle) * (baseRadius + len);
          ctx.strokeStyle = i % 2 === 0 ? accent1 : accent2;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      } else if (mode === "Particles") {
        const cx = w / 2, cy = h / 2;
        const avg = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
        particlesRef.current.forEach((p, i) => {
          p.angle += p.speed * 0.01 * (1 + avg * sensitivity);
          const r = p.radius + avg * sensitivity * 60;
          const x = cx + Math.cos(p.angle) * r;
          const y = cy + Math.sin(p.angle) * r;
          ctx.beginPath();
          ctx.arc(x, y, p.size * window.devicePixelRatio * (1 + avg), 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? accent1 : accent2;
          ctx.globalAlpha = 0.5 + avg * 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [mode, sensitivity, analyserRef]);

  return (
    <div
      className="mh-glass p-3"
      style={{ borderRadius: "var(--mh-radius-lg)", background: "var(--mh-surface)", maxWidth: 640, margin: "0 auto" }}
    >
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div>
          <div className="d-flex align-items-center gap-2 fw-bold">
            Audio Waveform Visualizer
          </div>
          <div className="text-secondary" style={{ fontSize: 12 }}>Reactive Frequency Canvas</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex gap-1">
            {MODES.map((m) => (
              <button
                key={m} onClick={() => setMode(m)}
                className="btn btn-sm px-2 py-1"
                style={{
                  fontSize: 11, borderRadius: 6, border: "none",
                  background: mode === m ? "var(--mh-accent-gradient)" : "var(--mh-surface-raised)",
                  color: mode === m ? "#0b0d10" : "var(--mh-text-primary)",
                }}
              >
                {m}
              </button>
            ))}
          </div>
          {onClose && (
            <button className="mh-icon-btn" onClick={onClose} aria-label="Close visualizer"><X size={16} /></button>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ width: "100%", height: 220, display: "block", borderRadius: "var(--mh-radius-sm)" }} />

      {!isPlaying && (
        <p className="text-secondary text-center mt-2 mb-0" style={{ fontSize: 12 }}>Play a song to see it react.</p>
      )}

      <div className="d-flex align-items-center gap-2 mt-3">
        <span className="text-secondary" style={{ fontSize: 11 }}>Amplitude Sensitivity</span>
        <input
          type="range" min={0.5} max={2} step={0.1} value={sensitivity}
          onChange={(e) => setSensitivity(Number(e.target.value))}
          className="form-range flex-grow-1"
        />
        <span className="text-secondary" style={{ fontSize: 11 }}>{sensitivity.toFixed(1)}x</span>
      </div>
    </div>
  );
}
