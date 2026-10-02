import { Music2 } from "lucide-react";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", background: "var(--mh-bg)" }}
    >
      <div
        className="d-flex flex-column flex-lg-row w-100 mh-glass"
        style={{ maxWidth: 920, borderRadius: "var(--mh-radius-lg)", overflow: "hidden", margin: 16 }}
      >
        {/* Branding side */}
        <div
          className="d-none d-lg-flex flex-column justify-content-between p-5"
          style={{ flex: 1, background: "var(--mh-accent-gradient)", color: "#0b0d10" }}
        >
          <div className="d-flex align-items-center gap-2 fw-bold fs-4">
            <Music2 size={28} /> MusicHub
          </div>
          <div>
            <h2 className="fw-bold">Your sound, your space.</h2>
            <p className="mb-0" style={{ opacity: 0.85 }}>
              Stream, discover, and build playlists that feel like you.
            </p>
          </div>
        </div>

        {/* Form side */}
        <div className="p-4 p-lg-5" style={{ flex: 1, background: "var(--mh-surface)" }}>
          <div className="d-flex d-lg-none align-items-center gap-2 fw-bold fs-4 mb-4">
            <Music2 size={24} style={{ color: "var(--mh-accent-2)" }} /> MusicHub
          </div>
          <h3 className="fw-bold mb-1">{title}</h3>
          {subtitle && <p className="text-secondary mb-4">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
