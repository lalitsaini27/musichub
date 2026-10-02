import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ ...form, remember });
      toast.success("Welcome back!");
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username/email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Log in to MusicHub" subtitle="Pick up right where you left off.">
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
        {error && <div className="alert alert-danger py-2 small mb-0">{error}</div>}

        <div>
          <label className="form-label small text-secondary">Username or email</label>
          <input
            className="form-control mh-input"
            name="identifier"
            value={form.identifier}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </div>

        <div>
          <div className="d-flex justify-content-between">
            <label className="form-label small text-secondary">Password</label>
            <Link to="/forgot-password" className="small" style={{ color: "var(--mh-accent-2)" }}>
              Forgot password?
            </Link>
          </div>
          <input
            className="form-control mh-input"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label className="form-check-label small text-secondary" htmlFor="remember">
            Remember me
          </label>
        </div>

        <button type="submit" className="mh-btn-primary" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-secondary small text-center mb-0">
          New to MusicHub?{" "}
          <Link to="/register" style={{ color: "var(--mh-accent-2)" }}>Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
