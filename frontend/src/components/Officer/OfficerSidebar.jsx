import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoImage from "../../assets/Logo.png";
import "../../styles/Officer/OfficerSidebar.css";

// ── Icons ─────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconFolder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconCpu = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMsg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── Flat nav items (before Demographics group) ─────────────
const NAV_TOP = [
  { label: "Dashboard",        path: "/officer/dashboard",   icon: <IconDashboard /> },
  { label: "Cases",            path: "/officer/cases",       icon: <IconFolder />    },
  { label: "Criminal Records", path: "/officer/records",     icon: <IconBook />      },
  { label: "Crime Prediction", path: "/officer/prediction",  icon: <IconCpu />       },
];

// ── Demographics sub-items ─────────────────────────────────
const DEMO_ITEMS = [
  { label: "Criminal Analysis", path: "/officer/criminal", icon: <IconUser /> },
  { label: "Victim Analysis",   path: "/officer/victim",   icon: <IconFile /> },
];

const NAV_BOTTOM = [
  { label: "Communication", path: "/officer/communication", icon: <IconMsg /> },
];

function applyOfficerSettings(prefs) {
  if (!prefs) return;
  document.documentElement.setAttribute('data-theme', prefs.theme === 'dark' ? 'dark' : 'light');
}

export default function OfficerSidebar() {
  const navigate       = useNavigate();
  const { pathname }   = useLocation();
  const { user, logout } = useAuth();

  // Apply saved officer settings (theme etc.) whenever user/settings change
  useEffect(() => {
    applyOfficerSettings(user?.settings?.preferences);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [user?.settings?.preferences?.theme]);

  // Demographics group open if currently on a demo sub-page
  const demoActive = DEMO_ITEMS.some(i => pathname === i.path);
  const [demoOpen, setDemoOpen] = useState(demoActive);

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "OF";

  return (
    <>
      <header className="officer-topbar">
        <button className="officer-topbar-brand" onClick={() => navigate("/")}>
          <img src={logoImage} alt="CRIMSON logo" className="officer-topbar-logo" />
          <span className="officer-topbar-text">CRIMSON</span>
        </button>
        <button className="officer-topbar-home" onClick={() => navigate("/")}>Back to Home</button>
      </header>

      <aside className="officer-sidebar">
        {/* ── Profile ── */}
        <button className="officer-sidebar-profile" onClick={() => navigate("/officer/profile")}>
          <div className="officer-sidebar-avatar">
            {user?.profilePhoto
              ? <img src={user.profilePhoto} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              : initials}
          </div>
          <div className="officer-sidebar-info">
            <span className="officer-sidebar-name">{user?.fullName || "Officer"}</span>
            <span className="officer-sidebar-role">OFFICER</span>
          </div>
        </button>
 
        {/* ── Nav ── */}
        <nav className="officer-sidebar-nav">
          {/* Top flat items */}
          {NAV_TOP.map(item => (
            <button
              key={item.path}
              className={`officer-nav-item${pathname === item.path ? " officer-nav-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="officer-nav-icon">{item.icon}</span>
              <span className="officer-nav-label">{item.label}</span>
            </button>
          ))}

          {/* Demographics collapsible group */}
          <button
            className={`officer-nav-item officer-nav-group${demoActive ? " officer-nav-active" : ""}`}
            onClick={() => setDemoOpen(o => !o)}
          >
            <span className="officer-nav-icon"><IconBarChart /></span>
            <span className="officer-nav-label">Demographics</span>
            <span className="officer-nav-chevron"><IconChevron open={demoOpen} /></span>
          </button>
          {demoOpen && (
            <div className="officer-nav-sub">
              {DEMO_ITEMS.map(item => (
                <button
                  key={item.path}
                  className={`officer-nav-item officer-nav-subitem${pathname === item.path ? " officer-nav-active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="officer-nav-icon">{item.icon}</span>
                  <span className="officer-nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Bottom flat items */}
          {NAV_BOTTOM.map(item => (
            <button
              key={item.path}
              className={`officer-nav-item${pathname === item.path ? " officer-nav-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="officer-nav-icon">{item.icon}</span>
              <span className="officer-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div className="officer-sidebar-footer">
          <button className="officer-nav-item officer-logout-btn" onClick={logout}>
            <span className="officer-nav-icon"><IconLogout /></span>
            <span className="officer-nav-label">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
