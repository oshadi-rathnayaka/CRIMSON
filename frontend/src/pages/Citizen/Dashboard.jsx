import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCitizenAlerts } from "../../api/alerts";
import logoImage from "../../assets/Logo.png";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/Citizen/Dashboard.css";

const DASHBOARD_DISTRICTS = [
  { name: "Colombo",      level: 4, crimes: 1245, lat: 6.9271, lng: 79.8612 },
  { name: "Gampaha",      level: 3, crimes: 782,  lat: 7.1600, lng: 80.0150 },
  { name: "Kalutara",     level: 2, crimes: 385,  lat: 6.5854, lng: 79.9607 },
  { name: "Kandy",        level: 3, crimes: 521,  lat: 7.2906, lng: 80.6337 },
  { name: "Matale",       level: 2, crimes: 298,  lat: 7.4675, lng: 80.6234 },
  { name: "Nuwara Eliya", level: 1, crimes: 124,  lat: 6.9497, lng: 80.7891 },
  { name: "Galle",        level: 2, crimes: 365,  lat: 6.0535, lng: 80.2210 },
  { name: "Matara",       level: 2, crimes: 342,  lat: 5.9496, lng: 80.5353 },
  { name: "Hambantota",   level: 1, crimes: 187,  lat: 6.1241, lng: 81.1185 },
  { name: "Jaffna",       level: 2, crimes: 412,  lat: 9.6615, lng: 80.0255 },
  { name: "Kilinochchi",  level: 1, crimes: 92,   lat: 9.3803, lng: 80.3770 },
  { name: "Mannar",       level: 1, crimes: 68,   lat: 8.9761, lng: 79.9045 },
  { name: "Vavuniya",     level: 2, crimes: 156,  lat: 8.7514, lng: 80.4971 },
  { name: "Mullaitivu",   level: 1, crimes: 103,  lat: 9.2671, lng: 80.8128 },
  { name: "Batticaloa",   level: 2, crimes: 289,  lat: 7.7102, lng: 81.6924 },
  { name: "Ampara",       level: 2, crimes: 267,  lat: 7.2912, lng: 81.6724 },
  { name: "Trincomalee",  level: 2, crimes: 234,  lat: 8.5922, lng: 81.1152 },
  { name: "Kurunegala",   level: 2, crimes: 445,  lat: 7.4818, lng: 80.3609 },
  { name: "Puttalam",     level: 1, crimes: 178,  lat: 8.0362, lng: 79.8283 },
  { name: "Anuradhapura", level: 1, crimes: 312,  lat: 8.3114, lng: 80.4037 },
  { name: "Polonnaruwa",  level: 1, crimes: 145,  lat: 7.9403, lng: 81.0188 },
  { name: "Badulla",      level: 2, crimes: 298,  lat: 6.9934, lng: 81.0550 },
  { name: "Monaragala",   level: 1, crimes: 121,  lat: 6.8728, lng: 81.3507 },
  { name: "Ratnapura",    level: 2, crimes: 267,  lat: 6.6828, lng: 80.3992 },
  { name: "Kegalle",      level: 2, crimes: 234,  lat: 7.2513, lng: 80.3464 },
];

const D_LEVEL_COLORS = { 1: "#22c55e", 2: "#eab308", 3: "#f97316", 4: "#ef4444" };
const D_LEVEL_LABELS = { 1: "Safe",    2: "Moderate", 3: "High Risk", 4: "Critical" };

function DashboardDistrictMap() {
  const mapDivRef = useRef(null);
  const mapRef    = useRef(null);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [7.8731, 80.7718],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
      doubleClickZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 13,
      minZoom: 6,
    }).addTo(map);

    DASHBOARD_DISTRICTS.forEach((d) => {
      const radius = Math.min(10 + Math.sqrt(d.crimes) * 0.62, 26);
      const color  = D_LEVEL_COLORS[d.level];

      L.circleMarker([d.lat, d.lng], {
        radius,
        fillColor:   color,
        color:       "#ffffff",
        weight:      2.5,
        fillOpacity: 0.82,
      })
      .bindTooltip(
        `<div style="font-family:sans-serif;min-width:130px">
          <div style="font-weight:700;font-size:13px;margin-bottom:3px">${d.name}</div>
          <div style="display:inline-block;background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;margin-bottom:4px">${D_LEVEL_LABELS[d.level].toUpperCase()}</div>
          <div style="font-size:12px;color:#444"><strong>${d.crimes.toLocaleString()}</strong> incidents</div>
        </div>`,
        { sticky: false, direction: "top", className: "hm-tooltip-wrap", offset: [0, -4], opacity: 1 }
      )
      .addTo(map);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  return (
    <div className="cd-map-wrap">
      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
      <div className="cd-map-legend">
        {[4, 3, 2, 1].map((lv) => (
          <div key={lv} className="cd-map-legend-item">
            <span className="cd-map-legend-dot" style={{ background: D_LEVEL_COLORS[lv] }} />
            {D_LEVEL_LABELS[lv]}
          </div>
        ))}
      </div>
    </div>
  );
}

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
              <DashboardDistrictMap />
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