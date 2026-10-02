import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created — welcome to MusicHub!");
      navigate("/", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") setErrors(data);
      else setErrors({ non_field_errors: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (name) => {
    const val = errors[name];
    if (!val) return null;
    return Array.isArray(val) ? val[0] : val;
  };

  return (
    <AuthLayout title="Create your account" subtitle="Free — start building your library in seconds.">
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
        {errors.non_field_errors && (
          <div className="alert alert-danger py-2 small mb-0">{errors.non_field_errors}</div>
        )}

        <div>
          <label className="form-label small text-secondary">Username</label>
          <input
            className="form-control mh-input" name="username" value={form.username}
            onChange={handleChange} placeholder="yourusername" required autoFocus
          />
          {fieldError("username") && <div className="text-danger small mt-1">{fieldError("username")}</div>}
        </div>

        <div>
          <label className="form-label small text-secondary">Email</label>
          <input
            className="form-control mh-input" type="email" name="email" value={form.email}
            onChange={handleChange} placeholder="you@example.com" required
          />
          {fieldError("email") && <div className="text-danger small mt-1">{fieldError("email")}</div>}
        </div>

        <div>
          <label className="form-label small text-secondary">Password</label>
          <input
            className="form-control mh-input" type="password" name="password" value={form.password}
            onChange={handleChange} placeholder="••••••••" required
          />
          {fieldError("password") && <div className="text-danger small mt-1">{fieldError("password")}</div>}
        </div>

        <div>
          <label className="form-label small text-secondary">Confirm password</label>
          <input
            className="form-control mh-input" type="password" name="password2" value={form.password2}
            onChange={handleChange} placeholder="••••••••" required
          />
          {fieldError("password2") && <div className="text-danger small mt-1">{fieldError("password2")}</div>}
        </div>

        <button type="submit" className="mh-btn-primary" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-secondary small text-center mb-0">
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--mh-accent-2)" }}>Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
