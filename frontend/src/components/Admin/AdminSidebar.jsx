import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoImage from "../../assets/Logo.png";
import "../../styles/Admin/AdminSidebar.css";

// ── Icons ─────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconDatabase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);
const IconActivity = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const NAV_ITEMS = [
  { label: "Dashboard",       path: "/admin/dashboard",      icon: <IconDashboard /> },
  { label: "User Management", path: "/admin/user",           icon: <IconUsers />     },
  { label: "Permissions",     path: "/admin/permissions",    icon: <IconShield />    },
  { label: "Audit Log",       path: "/admin/audit",          icon: <IconFile />      },
  { label: "Data Management", path: "/admin/data-management", icon: <IconDatabase />  },
  { label: "System Health",   path: "/admin/system-health",   icon: <IconActivity />  },
];

export default function AdminSidebar() {
  const navigate       = useNavigate();
  const { pathname }   = useLocation();
  const { user, logout } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  return (
    <>
      <header className="admin-topbar">
        <button className="admin-topbar-brand" onClick={() => navigate("/")}>
          <img src={logoImage} alt="CRIMSON logo" className="admin-topbar-logo" />
          <span className="admin-topbar-text">CRIMSON</span>
        </button>
        <button className="admin-topbar-home" onClick={() => navigate("/")}>Back to Home</button>
      </header>

      <aside className="admin-sidebar">
        {/* ── Profile ── */}
        <button
          className={`admin-sidebar-profile${pathname === "/admin/profile" ? " admin-nav-active" : ""}`}
          onClick={() => navigate("/admin/profile")}
          title="My Profile"
          style={{ cursor: "pointer", background: "none", border: "none", textAlign: "left", width: "100%", padding: 0 }}
        >
          <div className="admin-sidebar-avatar">{initials}</div>
          <div className="admin-sidebar-info">
            <span className="admin-sidebar-name">{user?.fullName || "Administrator"}</span>
            <span className="admin-sidebar-role">MY PROFILE</span>
          </div>
        </button>

        {/* ── Nav ── */}
        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`admin-nav-item${pathname === item.path ? " admin-nav-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div className="admin-sidebar-footer">
          <button className="admin-nav-item admin-logout-btn" onClick={logout}>
            <span className="admin-nav-icon"><IconLogout /></span>
            <span className="admin-nav-label">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
