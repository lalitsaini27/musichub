import { useNavigate } from "react-router-dom";
import { Music2 } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-center px-4"
      style={{ minHeight: "70vh" }}
    >
      <Music2 size={40} className="mb-3 text-secondary" />
      <h1 className="fw-bold mb-2">Page not found</h1>
      <p className="text-secondary mb-4" style={{ maxWidth: 360 }}>
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <button className="mh-btn-primary px-4" style={{ width: "auto" }} onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
}
