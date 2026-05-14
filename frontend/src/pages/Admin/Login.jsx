import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoImage from "../../assets/Logo.png";
import "../../styles/Admin/Login.css";

const ROLES = [
  "System Administrator",
  "Senior Superintendent",
  "Inspector General",
  "Deputy Inspector General",
  "Assistant Superintendent",
];

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [role, setRole] = useState("System Administrator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const result = await adminLogin(email.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate("/admin/dashboard", { replace: true });
    } else {
      setError(result.error || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="admin-login-page">
      {/* Navbar */}
      <nav className="admin-login-nav">
        <Link to="/" className="admin-login-nav__brand" style={{ textDecoration: "none" }}>
          <img src={logoImage} alt="CRIMSON logo" className="admin-login-nav__logo-icon" />
          <span className="admin-login-nav__brand-name">CRIMSON</span>
        </Link>
        <Link to="/login" className="admin-login-nav__signin-btn">Citizen Login</Link>
      </nav>

      <div className="admin-root">
      {/* ── LEFT PANEL ── */}
      <div className="admin-left">
        {/* Form area */}
        <div className="admin-form-area">
          {/* Restricted badge */}
          <div className="restricted-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>RESTRICTED ACCESS</span>
          </div>

          <h1 className="admin-title">Administrator Login</h1>
          <p className="admin-subtitle">
            Please authenticate with your official credentials to access
            the secure dashboard.
          </p>

          <form className="admin-form" onSubmit={handleLogin}>
            {error && (
              <div className="admin-error-banner">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}
            {/* Access Role */}
            <div className="field-group">
              <label className="field-label">Access Role</label>
              <div className="select-wrapper">
                <select
                  className="field-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <span className="select-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Email / ID */}
            <div className="field-group">
              <label className="field-label">Official Email / ID</label>
              <div className="field-wrapper">
                <span className="field-prefix-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <circle cx="12" cy="14" r="3" />
                    <path d="M16 7V5a4 4 0 0 0-8 0v2" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="field-input has-prefix"
                  placeholder="officer.name@police.gov.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="field-wrapper">
                <span className="field-prefix-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="field-input has-prefix has-suffix"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="field-suffix-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password"
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Reset row */}
            <div className="form-options-row">
              <label className="remember-label">
                <input
                  type="checkbox"
                  className="remember-checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="remember-box" aria-hidden="true">
                  {remember && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </span>
                <span className="remember-text">Remember device</span>
              </label>
              <a href="#" className="reset-link">Reset Credentials?</a>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className={`login-btn ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : "Login"}
            </button>
          </form>

          {/* Warning notice */}
          <div className="warning-notice">
            <div className="warning-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="warning-text">
              <strong>Authorized Personnel Only</strong>
              <p>
                This is a restricted government system. Unauthorized access
                attempts are a criminal offense under the Computer Crime Act No.
                24 of 2007. All activities are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="admin-right">
        <div className="right-content">
          <div className="system-pill">
            <span className="system-dot" />
            <span>System Operational • v2.4.1</span>
          </div>

          <h2 className="right-title">
            AI-Powered Predictive<br />Policing &amp; Victim<br />Support
          </h2>

          <p className="right-desc">
            Empowering law enforcement with real-time data integration and
            machine learning insights to prevent crime and support
            communities across Sri Lanka.
          </p>

          <div className="feature-cards">
            <div className="feature-card">
              <span className="feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </span>
              <span>Predictive Analytics</span>
            </div>
            <div className="feature-card">
              <span className="feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </span>
              <span>Case Management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}