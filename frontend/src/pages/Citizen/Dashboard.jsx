import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCitizenAlerts } from "../../api/alerts";
import logoImage from "../../assets/Logo.png";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/Dashboard.css";

const FALLBACK_ALERTS = [
  {
    id: 1,
    time: "10 mins ago · Traffic Police",
    title: "Heavy Traffic Alert",
    desc: "Avoid Galle Road near Kollupitiya due to ongoing peaceful protests. Police are directing traffic.",
    type: "traffic",
    color: "#f59e0b",
  },
  {
    id: 2,
    time: "2 hours ago · Cyber Crime Unit",
    title: "Phishing Scam Alert",
    desc: "New SMS scam targeting National Bank customers. Do not click links ending in .rst.",
    type: "cyber",
    color: "#E8192C",
  },
  {
    id: 3,
    time: "Yesterday · Community Safety",
    title: "Neighbourhood Watch Meeting",
    desc: "Monthly meeting for Nawala District scheduled for this Saturday at 10 AM.",
    type: "community",
    color: "#16a34a",
  },
];

const FALLBACK_TIPS = [
  {
    id: "tip-local-1",
    icon: "🔐",
    tag: "DIGITAL SAFETY",
    title: "Secure Your Social Media",
    desc: "Enable 2FA and review privacy settings regularly to reduce identity theft risks.",
  },
  {
    id: "tip-local-2",
    icon: "🆘",
    tag: "EMERGENCY READINESS",
    title: "Use SOS for Immediate Threats",
    desc: "Send SOS when danger is urgent so responders can prioritize high-risk situations quickly.",
  },
];

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState(FALLBACK_ALERTS);
  const [tips, setTips] = useState(FALLBACK_TIPS);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState("");

  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const loadAlerts = async () => {
    setAlertsLoading(true);
    setAlertsError("");

    try {
      const response = await getCitizenAlerts();
      const incomingAlerts = response?.data?.data?.alerts;
      const incomingTips = response?.data?.data?.tips;

      if (Array.isArray(incomingAlerts) && incomingAlerts.length > 0) {
        setAlerts(incomingAlerts);
      } else {
        setAlerts(FALLBACK_ALERTS);
      }

      if (Array.isArray(incomingTips) && incomingTips.length > 0) {
        setTips(incomingTips);
      } else {
        setTips(FALLBACK_TIPS);
      }
    } catch (error) {
      setAlertsError("Live alert feed is unavailable right now. Showing recent safety notices.");
      setAlerts(FALLBACK_ALERTS);
      setTips(FALLBACK_TIPS);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="cd-root">
      {/* TOP NAV */}
      <nav className="cd-nav">
        <div className="cd-nav-brand" onClick={() => navigate("/")}>
          <img src={logoImage} alt="CRIMSON logo" className="cd-nav-logo-icon" />
          <span className="cd-nav-logo-text">CRIMSON</span>
        </div>
        <ul className="cd-nav-links">
          <li className="active" onClick={() => navigate("/dashboard")}>Home</li>
          <li onClick={() => navigate("/report")}>Report</li>
          <li onClick={() => navigate("/heatmap")}>Heatmap</li>
          <li onClick={() => navigate("/support")}>Support</li>
        </ul>
        <div className="cd-nav-avatar" style={{ position: 'relative' }}>
          <div 
            className="cd-avatar-circle"
            onClick={() => navigate("/myprofile")}
            style={{ cursor: 'pointer' }}
            title="Go to My Profile"
          >
            {user?.fullName?.charAt(0) || 'C'}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="cd-main">

        {/* HEADER */}
        <div className="cd-header">
          <div>
            <h1 className="cd-welcome">Welcome Citizen</h1>
            <p className="cd-subtitle">Sri Lanka National Safety Dashboard</p>
          </div>
          <div className="cd-date-badge">📅 Today, {today}</div>
        </div>

        {/* EMERGENCY BANNER */}
        <div className="cd-emergency-banner">
          <div className="cd-emergency-left">
            <div className="cd-emergency-tag">
              <span className="cd-emergency-dot"></span> EMERGENCY MODE
            </div>
            <h2 className="cd-emergency-title">Need Immediate Assistance?</h2>
            <p className="cd-emergency-desc">
              If you or someone else is in immediate danger, press the SOS button
              to instantly alert the nearest police unit and share your live location.
            </p>
          </div>
          <button className="cd-sos-btn" onClick={() => navigate("/sos")}>
            <span className="cd-sos-text">SOS</span>
            <span className="cd-sos-sub">REQUEST<br />HELP</span>
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="cd-grid">
          {/* LEFT COLUMN */}
          <div className="cd-left">

            {/* MANAGE REPORTS */}
            <div className="cd-card">
              <h3 className="cd-card-title">Manage Reports & Safety</h3>
              <div className="cd-manage-row">
                <div className="cd-manage-item" onClick={() => navigate("/report")}>
                  <div className="cd-manage-icon report-icon">📄</div>
                  <p className="cd-manage-label">Report a Crime</p>
                  <p className="cd-manage-desc">File a detailed report with evidence securely.</p>
                </div>
                <div className="cd-manage-item" onClick={() => navigate("/my-reports")}>
                  <div className="cd-manage-icon myreport-icon">📋</div>
                  <p className="cd-manage-label">My Reports</p>
                  <p className="cd-manage-desc">Track status of your previously filed incidents.</p>
                </div>
              </div>
            </div>

            {/* HEATMAP */}
            <div className="cd-card">
              <div className="cd-heatmap-header">
                <h3 className="cd-card-title">District Crime Heatmap</h3>
                <span className="cd-view-map" onClick={() => navigate("/heatmap")}>View Full Map →</span>
              </div>
              <div className="cd-map-wrap">
                <iframe
                  title="Sri Lanka Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2021065.2!2d79.6!3d7.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2593cf65a1e9d%3A0xe13da4b400e2d38c!2sSri%20Lanka!5e0!3m2!1sen!2slk!4v1699999999999!5m2!1sen!2slk"
                  className="cd-map-iframe"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                <div className="cd-map-location-badge">
                  <span>📍</span>
                  <div>
                    <p className="cd-map-loc-label">CURRENT LOCATION</p>
                    <p className="cd-map-loc-name">Colombo District 01</p>
                  </div>
                </div>
                <div className="cd-map-risk-badge">
                  <span className="cd-risk-dot"></span> Risk Level: Moderate
                </div>
              </div>
            </div>

            {/* SAFETY TIPS */}
            <div className="cd-card">
              <h3 className="cd-card-title">Safety Tips</h3>
              {tips.map((tip) => (
                <div className="cd-tip-card" key={tip.id || tip.title}>
                  <div className="cd-tip-img">
                    <div className="cd-tip-icon-wrap">{tip.icon || "🔒"}</div>
                    <div className="cd-tip-overlay">
                      <span className="cd-tip-tag">{tip.tag || "SAFETY"}</span>
                      <p className="cd-tip-title">{tip.title}</p>
                      <p className="cd-tip-desc">{tip.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="cd-right">

            {/* SAFETY ALERTS */}
            <div className="cd-card">
              <div className="cd-alerts-header">
                <h3 className="cd-card-title">Safety Alerts & News</h3>
                <span className="cd-live-badge"><span className="cd-live-dot"></span> LIVE</span>
              </div>
              <div className="cd-alerts-list">
                {alertsLoading && (
                  <p className="cd-alert-status">Loading live alerts...</p>
                )}

                {!alertsLoading && alertsError && (
                  <p className="cd-alert-status cd-alert-status-warning">{alertsError}</p>
                )}

                {!alertsLoading && alerts.map((a) => (
                  <div className="cd-alert-item" key={a.id}>
                    <div className="cd-alert-indicator" style={{ background: a.color }}></div>
                    <div className="cd-alert-body">
                      <p className="cd-alert-time">{a.time}</p>
                      <p className="cd-alert-title">{a.title}</p>
                      <p className="cd-alert-desc">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="cd-view-all-btn" onClick={loadAlerts}>
                Refresh Alerts
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <CitizenFooter />


    </div>
  );
}