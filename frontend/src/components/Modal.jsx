import { X } from "lucide-react";

export default function Modal({ title, onClose, children, maxWidth = 420 }) {
  return (
    <div
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center p-3"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        className="mh-glass w-100 p-4"
        style={{ maxWidth, borderRadius: "var(--mh-radius-lg)", background: "var(--mh-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold mb-0">{title}</h5>
          <button className="btn btn-sm p-1 text-secondary" style={{ background: "none", border: "none" }} onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
