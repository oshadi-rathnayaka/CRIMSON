import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/Security.css";

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const TwoFAIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);

export default function Security() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // ── Privacy toggles (persist via backend + local) ──
  const initial = user?.privacySettings ?? { anonymousReporting: true, hideIdentity: true, shareData: false };
  const [toggles, setToggles] = useState(initial);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);
  const [privacyError, setPrivacyError] = useState("");

  // ── Change password modal state ──
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwServerError, setPwServerError] = useState("");

  const handleToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    setPrivacySaved(false);
    setPrivacyError("");
  };

  const handlePrivacySave = async () => {
    setPrivacySaving(true);
    setPrivacyError("");
    try {
      const res = await api.put("/auth/privacy", toggles);
      updateUser({ privacySettings: res.data.privacySettings });
      setPrivacySaved(true);
      setTimeout(() => setPrivacySaved(false), 3000);
    } catch (err) {
      setPrivacyError(err.response?.data?.message || "Failed to save privacy settings.");
    } finally {
      setPrivacySaving(false);
    }
  };

  const validatePw = () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = "Required.";
    if (!pwForm.newPassword) errs.newPassword = "Required.";
    else if (pwForm.newPassword.length < 8) errs.newPassword = "At least 8 characters.";
    if (!pwForm.confirmPassword) errs.confirmPassword = "Required.";
    else if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    return errs;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwSaving(true);
    setPwServerError("");
    try {
      await api.put("/auth/change-password", pwForm);
      setPwSuccess("Password changed successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => { setPwSuccess(""); setShowPwModal(false); }, 2000);
    } catch (err) {
      setPwServerError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  };

  const PRIVACY_SETTINGS = [
    {
      key: "anonymousReporting",
      label: "Anonymous Crime Reporting",
      desc: "Your name will not be attached to submitted reports by default.",
    },
    {
      key: "hideIdentity",
      label: "Hide identity in public records",
      desc: "Prevent your name from appearing in public case files.",
    },
    {
      key: "shareData",
      label: "Share anonymized data",
      desc: "Contribute to national crime statistics research anonymously.",
    },
  ];

  return (
    <div className="sec-page">
      {/* ── Navbar ── */}
      <CitizenNavbar />

      {/* ── Main ── */}
      <main className="sec-main">
        <h1 className="sec-page-title">Security &amp; Privacy</h1>

        <div className="sec-card">

          {/* Password Status */}
          <div className="sec-row sec-row--border">
            <div className="sec-row__icon sec-row__icon--grey">
              <LockIcon />
            </div>
            <div className="sec-row__text">
              <p className="sec-row__label">Password Status</p>
              <p className="sec-row__desc">Click to update your account password.</p>
            </div>
            <button
              className="sec-btn sec-btn--blue"
              onClick={() => { setShowPwModal(true); setPwServerError(""); setPwSuccess(""); setPwErrors({}); }}
            >
              Change Password
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="sec-row">
            <div className="sec-row__icon sec-row__icon--grey">
              <TwoFAIcon />
            </div>
            <div className="sec-row__text">
              <p className="sec-row__label">Two-Factor Authentication</p>
              <p className="sec-row__desc">Add an extra layer of security to your account.</p>
            </div>
            <button className="sec-btn sec-btn--blue" disabled style={{ opacity: 0.5 }}>
              Coming Soon
            </button>
          </div>

          {/* Divider */}
          <div className="sec-divider" />

          {/* Privacy Toggles */}
          {PRIVACY_SETTINGS.map((setting) => (
            <div key={setting.key} className="sec-toggle-row">
              <div className="sec-toggle-text">
                <p className="sec-toggle-label">{setting.label}</p>
                <p className="sec-toggle-desc">{setting.desc}</p>
              </div>
              <button
                className={`sec-switch ${toggles[setting.key] ? "sec-switch--on" : ""}`}
                onClick={() => handleToggle(setting.key)}
                aria-label={setting.label}
                role="switch"
                aria-checked={toggles[setting.key]}
              >
                <span className="sec-switch__thumb" />
              </button>
            </div>
          ))}

          {/* Privacy Save Row */}
          <div className="sec-privacy-save-row">
            {privacyError && <span className="sec-privacy-error">{privacyError}</span>}
            {privacySaved && <span className="sec-privacy-saved">✓ Privacy settings saved</span>}
            <button className="sec-btn sec-btn--blue" onClick={handlePrivacySave} disabled={privacySaving}>
              {privacySaving ? "Saving..." : "Save Privacy Settings"}
            </button>
          </div>

        </div>
      </main>

      {/* ── Change Password Modal ── */}
      {showPwModal && (
        <div className="sec-modal-overlay" onClick={() => setShowPwModal(false)}>
          <div className="sec-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="sec-modal__title">Change Password</h2>
            {pwSuccess && <div className="sec-modal__success">{pwSuccess}</div>}
            {pwServerError && <div className="sec-modal__error">{pwServerError}</div>}
            <form onSubmit={handleChangePassword} noValidate>
              <div className="sec-modal__field">
                <label>Current Password</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => { setPwForm(p => ({ ...p, currentPassword: e.target.value })); setPwErrors(p => ({ ...p, currentPassword: "" })); }}
                  autoComplete="current-password"
                />
                {pwErrors.currentPassword && <span className="sec-modal__field-error">{pwErrors.currentPassword}</span>}
              </div>
              <div className="sec-modal__field">
                <label>New Password</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => { setPwForm(p => ({ ...p, newPassword: e.target.value })); setPwErrors(p => ({ ...p, newPassword: "" })); }}
                  autoComplete="new-password"
                />
                {pwErrors.newPassword && <span className="sec-modal__field-error">{pwErrors.newPassword}</span>}
              </div>
              <div className="sec-modal__field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => { setPwForm(p => ({ ...p, confirmPassword: e.target.value })); setPwErrors(p => ({ ...p, confirmPassword: "" })); }}
                  autoComplete="new-password"
                />
                {pwErrors.confirmPassword && <span className="sec-modal__field-error">{pwErrors.confirmPassword}</span>}
              </div>
              <div className="sec-modal__actions">
                <button type="button" className="sec-btn sec-btn--grey" onClick={() => setShowPwModal(false)}>Cancel</button>
                <button type="submit" className="sec-btn sec-btn--blue" disabled={pwSaving}>
                  {pwSaving ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CitizenFooter />
    </div>
  );
}