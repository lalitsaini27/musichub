import { Search, Bell } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header
      className="d-flex align-items-center justify-content-between px-3 px-lg-4 py-3 position-sticky top-0"
      style={{ background: "rgba(11,13,16,0.85)", backdropFilter: "blur(10px)", zIndex: 30 }}
    >
      <Link
        to="/search"
        className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill flex-grow-1 flex-lg-grow-0"
        style={{ background: "var(--mh-surface-raised)", maxWidth: 420 }}
      >
        <Search size={16} className="text-secondary" />
        <span className="text-secondary small">Search songs, artists, albums...</span>
      </Link>

      <button
        className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center ms-3"
        style={{ width: 36, height: 36, background: "var(--mh-surface-raised)", border: "none" }}
      >
        <Bell size={16} className="text-secondary" />
      </button>
    </header>
  );
}
