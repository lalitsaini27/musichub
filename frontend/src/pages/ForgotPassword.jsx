import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {sent ? (
        <div className="alert alert-success py-3 small">
          If an account with that email exists, a reset link is on its way. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          {error && <div className="alert alert-danger py-2 small mb-0">{error}</div>}
          <div>
            <label className="form-label small text-secondary">Email</label>
            <input
              className="form-control mh-input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus
            />
          </div>
          <button type="submit" className="mh-btn-primary" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}

      <p className="text-secondary small text-center mb-0 mt-3">
        <Link to="/login" style={{ color: "var(--mh-accent-2)" }}>Back to log in</Link>
      </p>
    </AuthLayout>
  );
}
