import React, { useState, useEffect, useCallback } from "react";
import "../../styles/Officer/Dashboard.css";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import { api } from "../../lib/api";
import { formatOfficerDate, formatOfficerNumber, formatOfficerTime } from "../../lib/officerPreferences";

// ── Icons (inline SVG) ──
const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconFolder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconCpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconMsg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconGlobe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const RISK_META = {
  CRITICAL: { color: "#ef4444", bg: "#fef2f2", dot: "#dc2626" },
  HIGH:     { color: "#f97316", bg: "#fff7ed", dot: "#ea580c" },
  MEDIUM:   { color: "#eab308", bg: "#fefce8", dot: "#ca8a04" },
  LOW:      { color: "#22c55e", bg: "#f0fdf4", dot: "#16a34a" },
};

// ── Data ──
const navItems = [
  { label: "Dashboard", icon: <IconGrid />, active: true },
  { label: "Cases", icon: <IconFolder /> },
  { label: "Criminal Records", icon: <IconBook /> },
  { label: "Crime Prediction", icon: <IconCpu /> },
  { label: "Demographics", icon: <IconUsers /> },
  { label: "Communication", icon: <IconMsg /> },
];

const STATUS_BADGE = {
  submitted:    "st-submitted",
  under_review: "st-investigating",
  assigned:     "st-assigned",
  resolved:     "st-solved",
  closed:       "st-closed",
};

const STATUS_LABEL = {
  submitted:    "Submitted",
  under_review: "Under Investigation",
  assigned:     "Assigned",
  resolved:     "Solved",
  closed:       "Closed",
};

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const formatTime = (d) => formatOfficerTime(d, { hour: "2-digit", minute: "2-digit" });
const formatDate = (d) => formatOfficerDate(d, { year: "numeric", month: "2-digit", day: "2-digit" });
const REPORTS_PAGE_SIZE = 5;

const initialTasks = [];

function useTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Dashboard() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [tasks,        setTasks]        = useState(initialTasks);
  const [clusterAlert, setClusterAlert] = useState(null);
  const [sectorIntel,  setSectorIntel]  = useState({
    updatedLabel: "Updated recently",
    unitLabel: "Unit 4 Active",
    summary: "Operational feed not available",
  });
  const [reports,      setReports]      = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsPage, setReportsPage] = useState(1);
  const [dashboardStats, setDashboardStats] = useState({
    assignedCases: 0,
    pendingReports: 0,
    patrolRisk: "Low",
    clearanceRate: 0,
  });
  const now = useTime();

  const loadDashboardFeed = useCallback(async () => {
    try {
      const res = await api.get("/reports/officer-dashboard-feed");
      const data = res.data?.data;
      if (!data) return;

      setClusterAlert(data.clusterAlert || null);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setSectorIntel(data.sectorIntel || {
        updatedLabel: "Updated recently",
        unitLabel: "Unit 4 Active",
        summary: "Operational feed not available",
      });
      setAcknowledged(false);
    } catch {
      setClusterAlert(null);
      setTasks(initialTasks);
      setSectorIntel({
        updatedLabel: "Updated recently",
        unitLabel: "Unit 4 Active",
        summary: "Operational feed not available",
      });
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await api.get("/reports/all?limit=500");
      setReports(res.data?.data || []);
    } catch {
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const loadDashboardStats = useCallback(async () => {
    try {
      const res = await api.get("/reports/officer-stats");
      const data = res.data?.data;
      if (data) {
        setDashboardStats({
          assignedCases: data.assignedCases ?? 0,
          pendingReports: data.pendingReports ?? 0,
          patrolRisk: data.patrolRisk ?? "Low",
          clearanceRate: data.clearanceRate ?? 0,
        });
      }
    } catch {
      setDashboardStats({
        assignedCases: 0,
        pendingReports: 0,
        patrolRisk: "Low",
        clearanceRate: 0,
      });
    }
  }, []);

  useEffect(() => {
    loadDashboardFeed();
    loadReports();
    loadDashboardStats();
  }, [loadDashboardFeed, loadReports, loadDashboardStats]);

  const timeStr = formatOfficerTime(now, { hour: "2-digit", minute: "2-digit" });
  const dateStr = formatOfficerDate(now, { year: "numeric", month: "2-digit", day: "2-digit" });

  const toggleTask = (id) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const patrolRiskNorm = String(dashboardStats.patrolRisk || "").toLowerCase();
  const patrolRiskColor = patrolRiskNorm === "high"
    ? "red"
    : patrolRiskNorm === "medium"
      ? "orange"
      : "green";

  const statCards = [
    { label: "Assigned Cases", value: String(dashboardStats.assignedCases), icon: "📁", color: "blue" },
    { label: "Pending Reports", value: String(dashboardStats.pendingReports), icon: "📋", color: "orange" },
    { label: "Patrol Risk", value: dashboardStats.patrolRisk, icon: "⚠", color: patrolRiskColor, highlight: patrolRiskNorm === "high" },
    { label: "Clearance Rate", value: `${dashboardStats.clearanceRate}%`, icon: "📈", color: "green" },
  ];

  const reportsTotalPages = Math.max(1, Math.ceil(reports.length / REPORTS_PAGE_SIZE));
  const paginatedReports = reports.slice((reportsPage - 1) * REPORTS_PAGE_SIZE, reportsPage * REPORTS_PAGE_SIZE);

  const reportPageNumbers = () => {
    const pages = [];
    if (reportsTotalPages <= 5) {
      for (let i = 1; i <= reportsTotalPages; i++) pages.push(i);
    } else if (reportsPage <= 3) {
      pages.push(1, 2, 3, "...", reportsTotalPages);
    } else if (reportsPage >= reportsTotalPages - 2) {
      pages.push(1, "...", reportsTotalPages - 2, reportsTotalPages - 1, reportsTotalPages);
    } else {
      pages.push(1, "...", reportsPage, "...", reportsTotalPages);
    }
    return pages;
  };

  return (
    <div className="dash-page officer-with-sidebar">
      <OfficerSidebar />

      {/* ── Top Navbar ── */}
      <header className="dash-header">
        <div className="dash-header-brand">
          <span className="brand-icon">🛡</span>
          <span className="brand-name">CRIMSON</span>
        </div>
      </header>

      <div className="dash-body">
        {/* ── Main Content ── */}
        <main className="dash-main">
          {/* Header row */}
          <div className="dash-toprow">
            <div>
              <h1 className="dash-title">Officer Dashboard</h1>
              <p className="dash-subtitle">
                Welcome back, Sergeant. System Status:{" "}
                <span className="status-online">Online</span>
              </p>
            </div>
            <div className="dash-clock">
              <div className="clock-time">{timeStr}</div>
              <div className="clock-date">{dateStr}</div>
              <div className="bell-wrap">
                <IconBell />
                <span className="bell-dot" />
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="stat-grid">
            {statCards.map((s) => (
              <div key={s.label} className={`stat-card stat-${s.color}`}>
                <div className="stat-info">
                  <span className="stat-label">{s.label.toUpperCase()}</span>
                  <span className={`stat-value${s.highlight ? " stat-highlight" : ""}`}>{s.value}</span>
                </div>
                <div className={`stat-icon-wrap stat-icon-${s.color}`}>{s.icon}</div>
              </div>
            ))}
          </div>

          {/* AI Prediction Banner */}
          {!acknowledged && (() => {
            const riskKey = clusterAlert?.riskLevel || "HIGH";
            const risk = RISK_META[riskKey] || RISK_META.HIGH;
            return (
              <div className="ai-banner" style={{ borderLeftColor: risk.color }}>
                <div className="ai-banner-left">
                  <div className="ai-banner-tag" style={{ color: risk.color }}>
                    <span className="ai-dot" style={{ background: risk.dot }} />
                    DBSCAN CLUSTER ALERT · {riskKey}
                  </div>
                  <h2 className="ai-banner-title">
                    {clusterAlert?.title || "High-risk zone analysis unavailable"}
                  </h2>
                  <p className="ai-banner-body">
                    {clusterAlert?.message || "Backend alert feed did not return any cluster details for this period."}
                  </p>
                  <div className="ai-banner-actions">
                    <button className="btn-acknowledge" onClick={() => setAcknowledged(true)}>
                      Acknowledge
                    </button>
                    <button className="btn-intelligence">
                      View Intelligence →
                    </button>
                  </div>
                </div>
                <div className="ai-banner-map">
                  <div className="map-placeholder" style={{ borderColor: risk.color }}>
                    <div className="map-label" style={{ color: risk.color }}>
                      {(clusterAlert?.district || "SECTOR").slice(0, 6).toUpperCase()}
                    </div>
                    {clusterAlert?.incidents !== undefined && (
                      <div style={{ fontSize: "9px", color: risk.color, marginTop: 4, fontWeight: 600 }}>
                        {formatOfficerNumber(clusterAlert.incidents)} incidents
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cases Table + Right Column */}
          <div className="dash-lower">
            {/* Cases Table */}
            <div className="cases-panel">
              <div className="cases-header">
                <span className="panel-title" style={{ fontWeight: 700, fontSize: "0.9rem" }}>Recent Citizen Reports</span>
                <button
                  onClick={loadReports}
                  className="view-all"
                  style={{ cursor: "pointer", background: "none", border: "none" }}
                >
                  ↻ Refresh
                </button>
              </div>
              <table className="cases-table">
                <thead>
                  <tr>
                    <th>CASE ID</th>
                    <th>CATEGORY</th>
                    <th>LOCATION</th>
                    <th>DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsLoading ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>Loading reports…</td></tr>
                  ) : reports.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>No reports submitted yet</td></tr>
                  ) : (
                    paginatedReports.map((r) => {
                      const normalizedStatus = normalizeStatus(r.status);
                      return (
                      <tr key={r._id}>
                        <td className="case-id">{r.caseId}</td>
                        <td>
                          <span className="case-type">
                            <span className="case-type-icon">📋</span> {r.category}
                          </span>
                        </td>
                        <td>{r.location?.address || "Unknown"}</td>
                        <td>{formatDate(r.submittedAt)} {formatTime(r.submittedAt)}</td>
                        <td>
                          <span className={`st-badge ${STATUS_BADGE[normalizedStatus] || "st-submitted"}`}>
                            {STATUS_LABEL[normalizedStatus] || r.status}
                          </span>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="cases-footer">
                {reportsLoading ? "Loading…" : `Showing ${(reports.length === 0) ? 0 : (reportsPage - 1) * REPORTS_PAGE_SIZE + 1}-${Math.min(reportsPage * REPORTS_PAGE_SIZE, reports.length)} of ${reports.length} report${reports.length !== 1 ? "s" : ""}`}
              </div>
              {!reportsLoading && reports.length > 0 && (
                <div className="pagination-row dash-pagination-row">
                  <div className="pagination-controls">
                    <button
                      className="page-btn"
                      disabled={reportsPage === 1}
                      onClick={() => setReportsPage((p) => Math.max(1, p - 1))}
                    >← Previous</button>
                    {reportPageNumbers().map((p, i) =>
                      p === "..." ? (
                        <span key={`dash-ellipsis-${i}`} className="page-ellipsis">...</span>
                      ) : (
                        <button
                          key={`dash-page-${p}`}
                          className={`page-num${reportsPage === p ? " page-active" : ""}`}
                          onClick={() => setReportsPage(p)}
                        >{p}</button>
                      )
                    )}
                    <button
                      className="page-btn"
                      disabled={reportsPage === reportsTotalPages}
                      onClick={() => setReportsPage((p) => Math.min(reportsTotalPages, p + 1))}
                    >Next →</button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="right-col">
              {/* Tasks */}
              <div className="panel tasks-panel">
                <div className="panel-header">
                  <span className="panel-title">
                    <span className="panel-title-icon">≡</span> Tasks &amp; Deadlines
                  </span>
                  <button className="panel-add"><IconPlus /></button>
                </div>
                <div className="task-list">
                  {tasks.map((t) => (
                    <div key={t.id} className={`task-item${t.done ? " task-done" : ""}`}>
                      <button
                        className={`task-check${t.done ? " task-check-done" : ""}`}
                        onClick={() => toggleTask(t.id)}
                      >
                        {t.done && <IconCheck />}
                      </button>
                      <div className="task-info">
                        <span className={`task-label${t.done ? " task-label-done" : ""}`}>{t.label}</span>
                        <span className={`task-sub${t.urgent ? " task-urgent" : ""}`}>{t.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Intel */}
              <div className="panel intel-panel">
                <div className="panel-header">
                  <span className="panel-title">
                    <span className="panel-title-icon globe-icon"><IconGlobe /></span> Sector Intel
                  </span>
                </div>
                <div className="intel-map-placeholder" />
                <div className="intel-footer">
                  <span className="intel-updated">{sectorIntel.updatedLabel}</span>
                  <span className="intel-unit"><span className="unit-dot" /> {sectorIntel.unitLabel}</span>
                </div>
                <div style={{ marginTop: 8, fontSize: "12px", color: "#6b7280" }}>{sectorIntel.summary}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="dash-footer">
            © OFFICIAL POLICE USE ONLY · SECURE CONNECTION
          </div>
        </main>
      </div>
    </div>
  );
}