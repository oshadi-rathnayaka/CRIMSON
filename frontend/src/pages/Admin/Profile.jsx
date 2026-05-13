import { useState, useEffect } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import { getAdminProfile, updateAdminProfile, changeAdminPassword } from "../../api/adminProfile";
import "../../styles/Admin/Profile.css";

// ── Avatar initials ──────────────────────────────────────────────────────────
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminProfile() {
  const { user: authUser, updateUser } = useAuth();

  // ── Profile form state ───────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    district: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: "success"|"error", text }

  // ── Password form state ──────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  // ── Load profile on mount ────────────────────────────────────────────────
  useEffect(() => {
    getAdminProfile()
      .then((res) => {
        const u = res.data.user;
        setProfile({
          fullName: u.fullName || "",
          email: u.email || "",
          phone: u.phone || "",
          district: u.district || "",
        });
      })
      .catch(() => {
        // Fall back to cached auth user
        if (authUser) {
          setProfile({
            fullName: authUser.fullName || "",
            email: authUser.email || "",
            phone: authUser.phone || "",
            district: authUser.district || "",
          });
        }
      });
  }, []);

  // ── Save profile ─────────────────────────────────────────────────────────
  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const res = await updateAdminProfile({
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        district: profile.district.trim(),
      });
      setProfileMsg({ type: "success", text: res.data.message || "Profile updated successfully" });
      // Sync auth context so sidebar name updates immediately
      if (res.data.user) updateUser(res.data.user);
    } catch (err) {
      setProfileMsg({ type: "error", text: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  async function handleChangePassword(e) {
    e.preventDefault();
    setPwdMsg(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwdMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPwdMsg({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await changeAdminPassword(passwords.currentPassword, passwords.newPassword);
      setPwdMsg({ type: "success", text: res.data.message || "Password changed successfully" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwdMsg({ type: "error", text: err.response?.data?.message || "Failed to change password" });
    } finally {
      setPwdLoading(false);
    }
  }

  const initials = getInitials(profile.fullName || authUser?.fullName || "");

  return (
    <>
      <AdminSidebar />
      <main className="ap-page admin-with-sidebar">
        {/* Header */}
        <div className="ap-header">
          <div>
            <h1 className="ap-title">My Profile</h1>
            <p className="ap-subtitle">Update your account details and change your password</p>
          </div>
        </div>

        <div className="ap-grid">
          {/* ── Profile Info Card ──────────────────────────────────────── */}
          <div className="ap-card">
            <div className="ap-card-title">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Profile Information
            </div>

            {/* Avatar */}
            <div className="ap-avatar-row">
              <div className="ap-avatar">{initials}</div>
              <div className="ap-avatar-info">
                <strong style={{ fontSize: 15 }}>{profile.fullName || "—"}</strong>
                <p>{profile.email}</p>
                <span className="ap-badge">{authUser?.role || "admin"}</span>
              </div>
            </div>

            <hr className="ap-sep" />

            {profileMsg && (
              <div className={`ap-banner ap-banner-${profileMsg.type}`}>
                {profileMsg.type === "success" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                )}
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className="ap-field-group">
                <div className="ap-field">
                  <label className="ap-label">Full Name</label>
                  <input
                    className="ap-input"
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                    required
                    minLength={2}
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Email Address</label>
                  <input
                    className="ap-input"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Phone Number</label>
                  <input
                    className="ap-input"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label">District</label>
                  <input
                    className="ap-input"
                    type="text"
                    value={profile.district}
                    onChange={(e) => setProfile((p) => ({ ...p, district: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="ap-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="ap-btn ap-btn-ghost"
                  onClick={() => {
                    setProfileMsg(null);
                    getAdminProfile().then((res) => {
                      const u = res.data.user;
                      setProfile({ fullName: u.fullName || "", email: u.email || "", phone: u.phone || "", district: u.district || "" });
                    });
                  }}
                >
                  Discard
                </button>
                <button type="submit" className="ap-btn ap-btn-primary" disabled={profileLoading}>
                  {profileLoading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* ── Change Password Card ───────────────────────────────────── */}
          <div className="ap-card">
            <div className="ap-card-title">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Change Password
            </div>

            {pwdMsg && (
              <div className={`ap-banner ap-banner-${pwdMsg.type}`}>
                {pwdMsg.type === "success" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                )}
                {pwdMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="ap-field-group">
                <div className="ap-field">
                  <label className="ap-label">Current Password</label>
                  <input
                    className="ap-input"
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="ap-field">
                  <label className="ap-label">New Password</label>
                  <input
                    className="ap-input"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <span className="ap-hint">Minimum 8 characters, must differ from current</span>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Confirm New Password</label>
                  <input
                    className="ap-input"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="ap-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="ap-btn ap-btn-ghost"
                  onClick={() => {
                    setPwdMsg(null);
                    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                >
                  Clear
                </button>
                <button type="submit" className="ap-btn ap-btn-primary" disabled={pwdLoading}>
                  {pwdLoading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
