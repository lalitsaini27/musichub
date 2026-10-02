import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!uid || !token) {
    return (
      <AuthLayout title="Invalid reset link">
        <p className="text-secondary">
          This password reset link is missing required information. Please request a new one.
        </p>
        <Link to="/forgot-password" style={{ color: "var(--mh-accent-2)" }}>Request a new link</Link>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== password2) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ uid, token, new_password: password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set a new password">
      {done ? (
        <div className="alert alert-success py-3 small">
          Password updated — redirecting you to log in...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          {error && <div className="alert alert-danger py-2 small mb-0">{error}</div>}
          <div>
            <label className="form-label small text-secondary">New password</label>
            <input
              className="form-control mh-input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoFocus
            />
          </div>
          <div>
            <label className="form-label small text-secondary">Confirm new password</label>
            <input
              className="form-control mh-input" type="password" value={password2}
              onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••" required
            />
          </div>
          <button type="submit" className="mh-btn-primary" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
