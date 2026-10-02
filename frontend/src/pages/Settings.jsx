import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect width='160' height='160' fill='%231c2028'/%3E%3C/svg%3E";

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile, uploadAvatar, changePassword, logout } = useAuth();

  const [profileForm, setProfileForm] = useState({
    username: user?.username || "", email: user?.email || "", bio: user?.bio || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      toast.success("Profile updated.");
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") setProfileErrors(data);
      else toast.error("Couldn't update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success("Profile photo updated.");
    } catch {
      toast.error("Couldn't upload that image.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwErrors({});
    if (pwForm.new_password !== pwForm.confirm) {
      setPwErrors({ confirm: "Passwords don't match." });
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(pwForm);
      toast.success("Password changed.");
      setPwForm({ old_password: "", new_password: "", confirm: "" });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") setPwErrors(data);
      else toast.error("Couldn't change your password.");
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const fieldError = (errors, name) => {
    const val = errors[name];
    if (!val) return null;
    return Array.isArray(val) ? val[0] : val;
  };

  return (
    <div className="px-3 px-lg-4 py-4" style={{ maxWidth: 640 }}>
      <h1 className="fw-bold mb-4">Settings</h1>

      {/* Avatar */}
      <div className="d-flex align-items-center gap-3 mb-5">
        <div className="position-relative">
          <img
            src={user?.avatar || FALLBACK_AVATAR}
            alt={user?.username}
            style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover" }}
          />
          <label
            htmlFor="avatar-upload"
            className="position-absolute d-flex align-items-center justify-content-center"
            style={{
              bottom: 0, right: 0, width: 30, height: 30, borderRadius: "50%",
              background: "var(--mh-accent-gradient)", cursor: "pointer",
            }}
          >
            <Camera size={14} color="#0b0d10" />
          </label>
          <input id="avatar-upload" type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </div>
        <div className="text-secondary small">{uploadingAvatar ? "Uploading..." : "Click the camera icon to change your photo"}</div>
      </div>

      {/* Profile info */}
      <section className="mb-5">
        <h2 className="mh-section-title mb-3">Account Info</h2>
        <form onSubmit={handleProfileSubmit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small text-secondary">Username</label>
            <input
              className="form-control mh-input" value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
            />
            {fieldError(profileErrors, "username") && <div className="text-danger small mt-1">{fieldError(profileErrors, "username")}</div>}
          </div>
          <div>
            <label className="form-label small text-secondary">Email</label>
            <input
              type="email" className="form-control mh-input" value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
            {fieldError(profileErrors, "email") && <div className="text-danger small mt-1">{fieldError(profileErrors, "email")}</div>}
          </div>
          <div>
            <label className="form-label small text-secondary">Bio</label>
            <textarea
              className="form-control mh-input" rows={3} maxLength={200} value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            />
          </div>
          <button type="submit" className="mh-btn-primary px-4" style={{ width: "auto" }} disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="mb-5">
        <h2 className="mh-section-title mb-3">Change Password</h2>
        <form onSubmit={handlePwSubmit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small text-secondary">Current password</label>
            <input
              type="password" className="form-control mh-input" value={pwForm.old_password}
              onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })} required
            />
            {fieldError(pwErrors, "old_password") && <div className="text-danger small mt-1">{fieldError(pwErrors, "old_password")}</div>}
          </div>
          <div>
            <label className="form-label small text-secondary">New password</label>
            <input
              type="password" className="form-control mh-input" value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required
            />
            {fieldError(pwErrors, "new_password") && <div className="text-danger small mt-1">{fieldError(pwErrors, "new_password")}</div>}
          </div>
          <div>
            <label className="form-label small text-secondary">Confirm new password</label>
            <input
              type="password" className="form-control mh-input" value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required
            />
            {fieldError(pwErrors, "confirm") && <div className="text-danger small mt-1">{fieldError(pwErrors, "confirm")}</div>}
          </div>
          <button type="submit" className="mh-btn-primary px-4" style={{ width: "auto" }} disabled={savingPw}>
            {savingPw ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>

      {/* Logout */}
      <section>
        <button
          className="btn px-4"
          style={{ background: "var(--mh-surface-raised)", border: "none", color: "#e5484d", borderRadius: "var(--mh-radius-sm)" }}
          onClick={handleLogout}
        >
          Log Out
        </button>
      </section>
    </div>
  );
}
