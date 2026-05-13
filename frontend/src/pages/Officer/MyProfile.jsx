import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import "../../styles/Officer/MyProfile.css";

const MENU_ITEMS = [
  { key: "edit", label: "Edit Profile", path: "/officer/profile/edit" },
  { key: "setting", label: "Setting", path: "/officer/profile/settings" },
];

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function OfficerMyProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const profileImage = user?.profilePhoto || null;

  // Sync latest profile (including any saved photo) from the backend on mount.
  useEffect(() => {
    api.get("/officer/auth/me")
      .then((res) => { if (res.data?.user) updateUser(res.data.user); })
      .catch(() => {});
  }, []);

  const onPhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting the same file triggers onChange again.
    e.target.value = "";

    setUploading(true);
    setError("");

    const reader = new FileReader();
    reader.onerror = () => {
      setError("Could not read the selected file.");
      setUploading(false);
    };
    reader.onload = async (ev) => {
      try {
        const dataUrl = String(ev.target?.result || "");
        const res = await api.put("/officer/auth/profile", { profilePhoto: dataUrl });
        if (res.data?.user) {
          updateUser(res.data.user);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to upload profile picture.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="omp-page">
      <OfficerSidebar />

      <main className="omp-main">
        <h1 className="omp-title">My Profile</h1>

        <section className="omp-card">
          <div className="omp-header">
            <div className="omp-avatar-wrap">
              {profileImage ? (
                <img src={profileImage} alt="Officer profile" className="omp-avatar-img" />
              ) : (
                <div className="omp-avatar-fallback" />
              )}
            </div>

            <div className="omp-header-info">
              <h2 className="omp-name">{user?.fullName || "Officer"}</h2>
              <p className="omp-role">Officer Account</p>
              <button className="omp-photo-btn" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? "Uploading..." : "Add Profile Picture"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="omp-hidden-input"
                onChange={onPhotoPick}
              />
              {error && <p className="omp-error">{error}</p>}
            </div>
          </div>

          <div className="omp-divider" />

          <div className="omp-lock-grid">
            <label className="omp-lock-field">
              <span>Email (admin managed)</span>
              <input type="text" value={user?.email || ""} readOnly disabled />
            </label>
            <label className="omp-lock-field">
              <span>Password (not editable)</span>
              <input type="password" value="********" readOnly disabled />
            </label>
          </div>

          <div className="omp-divider" />

          <div className="omp-menu">
            {MENU_ITEMS.map((item) => (
              <button key={item.key} className="omp-menu-item" onClick={() => navigate(item.path)}>
                <span>{item.label}</span>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
