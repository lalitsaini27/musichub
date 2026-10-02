import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Wrap a <Route element={...}> to require staff/admin access, not just login. */
export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!(user?.is_staff || user?.is_admin_user)) {
    return (
      <div className="px-3 px-lg-4 py-5 text-center">
        <p className="fw-semibold mb-1">You don't have access to this page</p>
        <p className="text-secondary small">The Admin Dashboard is restricted to MusicHub staff.</p>
      </div>
    );
  }
  return children;
}
