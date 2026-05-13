import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoImage from "../../assets/Logo.png";
import officerLoginImg from "../../assets/OfficerLogin.png";
import "../../styles/Officer/Login.css";

function useOfficerLoginTheme() {
  useEffect(() => {
    // Read officer theme preference from localStorage (set when officer was last logged in).
    let theme = "light";
    try {
      const raw = localStorage.getItem("authUser");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.role === "officer" && parsed?.settings?.preferences?.theme === "dark") {
          theme = "dark";
        }
      }
    } catch {
      // ignore
    }
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
    return () => {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.style.colorScheme = "";
    };
  }, []);
}

const OFFICER_LOGIN_MEMORY_KEY = "officerLoginMemory";

const getStoredOfficerLoginMemory = () => {
  try {
    const raw = localStorage.getItem(OFFICER_LOGIN_MEMORY_KEY);
    if (!raw) return { fullName: "", district: "" };
    const parsed = JSON.parse(raw);
    return {
      fullName: String(parsed?.fullName || ""),
      district: String(parsed?.district || ""),
    };
  } catch {
    return { fullName: "", district: "" };
  }
};

const storeOfficerLoginMemory = (fullName, district) => {
  localStorage.setItem(OFFICER_LOGIN_MEMORY_KEY, JSON.stringify({
    fullName: fullName.trim(),
    district: district.trim(),
  }));
};

export default function Login() {
  const navigate = useNavigate();
  const { officerLogin } = useAuth();
  useOfficerLoginTheme();
  const rememberedLogin = getStoredOfficerLoginMemory();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState(rememberedLogin.fullName);
  const [district, setDistrict] = useState(rememberedLogin.district);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!fullName.trim() || !district.trim() || !email.trim() || !password) {
      setLoginError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const result = await officerLogin(email.trim(), password, fullName.trim(), district.trim());
    setLoading(false);
    if (result.success) {
      storeOfficerLoginMemory(fullName, district);
      navigate("/officer/dashboard");
    } else {
      setLoginError(result.error || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="officer-login-page">
      {/* Navbar */}
      <nav className="officer-login-nav">
        <div className="officer-login-nav__brand">
          <img src={logoImage} alt="CRIMSON logo" className="officer-login-nav__logo-icon" />
          <span className="officer-login-nav__brand-name">CRIMSON</span>
        </div>
        <Link to="/login" className="officer-login-nav__signin-btn">Citizen Login</Link>
      </nav>

      <div className="crimson-root">
      {/* Left Panel */}
      <div className="login-panel">
        <div className="login-body">
          <div className="login-title-block">
            <h1 className="login-title">Officer Login</h1>
            <p className="login-subtitle">
              Authorized Access Only · Sri Lanka Police Service
            </p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="field-group">
              <label className="field-label">FULL NAME</label>
              <div className="field-wrapper">
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Officer K. Silva"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setLoginError(""); }}
                  autoComplete="name"
                />
                <span className="field-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">DISTRICT</label>
              <div className="field-wrapper">
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Colombo"
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setLoginError(""); }}
                  autoComplete="address-level2"
                />
                <span className="field-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">EMAIL ADDRESS</label>
              <div className="field-wrapper">
                <input
                  type="email"
                  className="field-input"
                  placeholder="e.g. officer@crimson.gov.lk"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                  autoComplete="email"
                />
                <span className="field-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <circle cx="12" cy="14" r="3" />
                    <path d="M16 7V5a4 4 0 0 0-8 0v2" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label">PASSWORD</label>
                <a href="#" className="forgot-link">Forgot Password?</a>
              </div>
              <div className="field-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="field-input"
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="field-icon field-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mfa-notice">
              <div className="mfa-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
                </svg>
              </div>
              <div className="mfa-text">
                <strong>Multi-Factor Authentication Required</strong>
                <p>
                  A dynamic verification code will be requested on the next
                  screen. Please ensure your token device is active.
                </p>
              </div>
            </div>

            {loginError && (
              <div className="login-error-banner">{loginError}</div>
            )}

            <button
              type="submit"
              className={`login-btn ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner" />
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="support-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
            <a href="#">Contact IT Support</a>
          </div>
        </div>

        <div className="login-footer">
          <div className="footer-warning">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              <strong>Warning:</strong> Unauthorized access to this system is a
              punishable offense under the Computer Crime Act No. 24 of 2007.
              All activities are monitored and logged.
            </span>
          </div>
          <div className="footer-bar">
            <span>CRIMSON V2.4.0</span>
            <span>© 2026 SRI LANKA POLICE</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="info-panel">
        <img src={officerLoginImg} alt="Officer Login" className="info-panel-bg" />
        <div className="info-card">
          <div className="status-badge">
            <span className="status-label">SYSTEM OPERATIONAL</span>
            <span className="status-dot" />
          </div>
          <h2 className="info-title">
            Predictive Policing &<br />Incident Management
          </h2>
          <p className="info-desc">
            The CRIMSON platform leverages advanced AI to analyze crime
            patterns, deploy resources efficiently, and support victim
            management protocols in real-time.
          </p>
          <div className="info-stats">
            <div className="stat">
              <span className="stat-value">24/7</span>
              <span className="stat-label">UPTIME</span>
            </div>
            <div className="stat">
              <span className="stat-value">99.9%</span>
              <span className="stat-label">ACCURACY</span>
            </div>
            <div className="stat">
              <span className="stat-value">Secure</span>
              <span className="stat-label">ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}