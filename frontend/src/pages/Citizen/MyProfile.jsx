import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/MyProfile.css";

const MENU_ITEMS = [
  {
    key: "edit",
    label: "Edit Profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    path: "/profile/edit",
  },
  {
    key: "security",
    label: "Security & Privacy",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    path: "/profile/security",
  },
  {
    key: "settings",
    label: "Setting",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    path: "/profile/settings",
  },
  {
    key: "logout",
    label: "Logout",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    action: "logout",
  },
];

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function MyProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [avatarSrc, setAvatarSrc] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleMenuClick = (item) => {
    if (item.action === "logout") {
      logout();
      navigate("/login");
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="mp-page">
      {/* ── Navbar ── */}
      <CitizenNavbar />

      {/* ── Main Content ── */}
      <main className="mp-main">
        <h1 className="mp-page-title">My Profile</h1>

        <div className="mp-card">
          {/* Profile Header */}
          <div className="mp-profile-header">
            <div className="mp-avatar-wrap">
              <div className="mp-avatar-circle" style={avatarSrc ? { padding: 0, overflow: 'hidden' } : {}}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : (user?.fullName?.charAt(0) || 'U')}
              </div>
            </div>
            <div className="mp-profile-info">
              <div className="mp-name-row">
                <span className="mp-name">{user?.fullName || 'User'}</span>
                <span className="mp-verified-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Verified
                </span>
              </div>
              <p className="mp-citizen-id">Email: {user?.email}</p>
              <p className="mp-location">Citizen • Member since {new Date().getFullYear()}</p>
              <button
                className="mp-change-photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mp-divider" />

          {/* Menu Items */}
          <div className="mp-menu">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                className="mp-menu-item"
                onClick={() => handleMenuClick(item)}
              >
                <span className="mp-menu-icon">{item.icon}</span>
                <span className="mp-menu-label">{item.label}</span>
                <span className="mp-menu-chevron"><ChevronRight /></span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <CitizenFooter />
    </div>
  );
}