import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import { api } from "../../lib/api";
import { getMySOS } from "../../api/sos";
import "../../styles/Citizen/MyReports.css";

const CATEGORY_LABELS = {
  theft:      "Theft / Robbery",
  assault:    "Physical Assault",
  harassment: "Sexual Harassment",
  cybercrime: "Cybercrime",
  bribery:    "Bribery / Corruption",
  traffic:    "Traffic Violation",
  drug:       "Drug / Narcotics",
};

const REPORT_STATUS_META = {
  submitted:    { label: "Submitted",     color: "mr-status--submitted" },
  under_review: { label: "Under Review",  color: "mr-status--review" },
  assigned:     { label: "Assigned",      color: "mr-status--assigned" },
  resolved:     { label: "Resolved",      color: "mr-status--resolved" },
  closed:       { label: "Closed",        color: "mr-status--closed" },
};

const SOS_STATUS_META = {
  active:    { label: "Active",     color: "sos-status--active" },
  resolved:  { label: "Resolved",   color: "sos-status--resolved" },
  cancelled: { label: "Cancelled",  color: "sos-status--cancelled" },
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-LK", {
    year: "numeric", month: "short", day: "numeric",
  });

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-LK", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

export default function MyReports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports]   = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const didMountRef = useRef(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsRes, sosRes] = await Promise.all([
        api.get("/reports/my-reports"),
        getMySOS(),
      ]);
      setReports(reportsRes.data.data || []);
      setSosAlerts(sosRes.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    loadData();
  }, [activeTab]);

  return (
    <div className="mr-page">
      <CitizenNavbar />

      <main className="mr-main">
        <div className="mr-container">

          {/* Header */}
          <div className="mr-header">
            <div>
              <h1 className="mr-title">My Reports & SOS History</h1>
              <p className="mr-subtitle">Track the status of all your submitted incident reports and emergency SOS requests</p>
            </div>
            <button className="mr-new-btn" onClick={() => navigate("/report")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              File New Report
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mr-tabs">
            <button
              className={`mr-tab ${activeTab === "reports" ? "active" : ""}`}
              onClick={() => setActiveTab("reports")}
            >
              <span className="mr-tab-icon">📋</span>
              Reports
              <span className="mr-tab-badge">{reports.length}</span>
            </button>
            <button
              className={`mr-tab ${activeTab === "sos" ? "active" : ""}`}
              onClick={() => setActiveTab("sos")}
            >
              <span className="mr-tab-icon">🚨</span>
              SOS Requests
              <span className="mr-tab-badge">{sosAlerts.length}</span>
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mr-loading">
              <div className="mr-spinner"/>
              <span>Loading your {activeTab === "reports" ? "reports" : "SOS requests"}…</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mr-error">
              <span>⚠ {error}</span>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {/* ────────────── REPORTS TAB ────────────── */}
          {!loading && !error && activeTab === "reports" && (
            <>
              {/* Empty state for reports */}
              {reports.length === 0 && (
                <div className="mr-empty">
                  <div className="mr-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <h2 className="mr-empty-title">No reports yet</h2>
                  <p className="mr-empty-desc">You haven't filed any reports. When you do, they'll appear here.</p>
                  <button className="mr-new-btn" onClick={() => navigate("/report")}>
                    File Your First Report
                  </button>
                </div>
              )}

              {/* Reports list */}
              {reports.length > 0 && (
                <div className="mr-list">
                  {/* Summary bar */}
                  <div className="mr-summary-bar">
                    <span>{reports.length} report{reports.length !== 1 ? "s" : ""} total</span>
                    <span className="mr-summary-dot"/>
                    <span>{reports.filter(r => r.status === "submitted" || r.status === "under_review").length} active</span>
                    <span className="mr-summary-dot"/>
                    <span>{reports.filter(r => r.status === "resolved" || r.status === "closed").length} resolved</span>
                  </div>

                  {reports.map((report) => {
                    const statusMeta = REPORT_STATUS_META[report.status] || { label: report.status, color: "mr-status--submitted" };
                    const catLabel   = CATEGORY_LABELS[report.category] || report.category;

                    return (
                      <div key={report._id} className="mr-card">
                        {/* Card top */}
                        <div className="mr-card__top">
                          <div className="mr-card__left">
                            <span className="mr-case-id">{report.caseId}</span>
                            <span className="mr-category">{catLabel}</span>
                          </div>
                          <span className={`mr-status ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="mr-description">
                          {report.description?.length > 140
                            ? report.description.slice(0, 140) + "…"
                            : report.description}
                        </p>

                        {/* Meta row */}
                        <div className="mr-card__meta">
                          {report.location?.address && report.location.address !== "Unknown" && (
                            <span className="mr-meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              {report.location.address}
                            </span>
                          )}
                          <span className="mr-meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {formatDate(report.submittedAt)} · {formatTime(report.submittedAt)}
                          </span>
                          {report.files?.length > 0 && (
                            <span className="mr-meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                              </svg>
                              {report.files.length} attachment{report.files.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {/* Status timeline */}
                        <div className="mr-timeline">
                          {["submitted","under_review","assigned","resolved"].map((s, i) => {
                            const statuses = ["submitted","under_review","assigned","resolved","closed"];
                            const currentIdx = statuses.indexOf(report.status);
                            const thisIdx    = statuses.indexOf(s);
                            const done    = currentIdx >= thisIdx;
                            const current = currentIdx === thisIdx;
                            return (
                              <div key={s} className={`mr-tl-step ${done ? "done" : ""} ${current ? "current" : ""}`}>
                                <div className="mr-tl-dot"/>
                                <span className="mr-tl-label">{REPORT_STATUS_META[s]?.label || s}</span>
                                {i < 3 && <div className={`mr-tl-line ${done && currentIdx > thisIdx ? "done" : ""}`}/>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ────────────── SOS TAB ────────────── */}
          {!loading && !error && activeTab === "sos" && (
            <>
              {/* Empty state for SOS */}
              {sosAlerts.length === 0 && (
                <div className="mr-empty">
                  <div className="mr-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="12" x2="16" y2="14"/>
                    </svg>
                  </div>
                  <h2 className="mr-empty-title">No SOS requests yet</h2>
                  <p className="mr-empty-desc">You haven't sent any SOS requests. Stay safe and use SOS only when in immediate danger.</p>
                  <button className="mr-new-btn" onClick={() => navigate("/sos")}>
                    Send SOS Request
                  </button>
                </div>
              )}

              {/* SOS list */}
              {sosAlerts.length > 0 && (
                <div className="mr-list">
                  {/* Summary bar */}
                  <div className="mr-summary-bar">
                    <span>{sosAlerts.length} SOS request{sosAlerts.length !== 1 ? "s" : ""} total</span>
                    <span className="mr-summary-dot"/>
                    <span>{sosAlerts.filter(s => s.status === "active").length} active</span>
                    <span className="mr-summary-dot"/>
                    <span>{sosAlerts.filter(s => s.status === "resolved" || s.status === "cancelled").length} completed</span>
                  </div>

                  {sosAlerts.map((alert) => {
                    const statusMeta = SOS_STATUS_META[alert.status] || { label: alert.status, color: "sos-status--active" };
                    const duration = alert.resolvedAt || alert.cancelledAt
                      ? (() => {
                          const startTime = new Date(alert.activatedAt).getTime();
                          const endTime = new Date(alert.resolvedAt || alert.cancelledAt).getTime();
                          const durationMs = endTime - startTime;
                          const seconds = Math.round(durationMs / 1000);
                          if (seconds < 60) return `${seconds}s`;
                          const minutes = Math.floor(seconds / 60);
                          return `${minutes}m`;
                        })()
                      : null;

                    return (
                      <div key={alert._id || alert.caseId} className="mr-card sos-card">
                        {/* Card top */}
                        <div className="mr-card__top">
                          <div className="mr-card__left">
                            <span className="mr-case-id">{alert.caseId}</span>
                            <span className="mr-category sos-category">Emergency SOS</span>
                          </div>
                          <span className={`mr-status ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                        </div>

                        {/* Location info */}
                        <p className="mr-description sos-description">
                          {alert.location?.address || "Location not specified"}
                          {alert.location?.district && ` · ${alert.location.district} District`}
                        </p>

                        {/* Meta row */}
                        <div className="mr-card__meta">
                          {alert.location?.address && alert.location.address !== "Unknown" && (
                            <span className="mr-meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              {alert.location.address}
                            </span>
                          )}
                          <span className="mr-meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {formatDate(alert.activatedAt)} · {formatTime(alert.activatedAt)}
                          </span>
                          {duration && alert.status !== "active" && (
                            <span className="mr-meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                              Response time: {duration}
                            </span>
                          )}
                        </div>

                        {/* SOS Status timeline */}
                        <div className="mr-timeline sos-timeline">
                          {["active", "resolved"].map((s, i) => {
                            const sosStatuses = ["active", "resolved", "cancelled"];
                            const currentIdx = sosStatuses.indexOf(alert.status);
                            const thisIdx    = sosStatuses.indexOf(s);
                            const done    = currentIdx >= thisIdx;
                            const current = currentIdx === thisIdx;
                            return (
                              <div key={s} className={`mr-tl-step ${done ? "done" : ""} ${current ? "current" : ""}`}>
                                <div className="mr-tl-dot"/>
                                <span className="mr-tl-label">{SOS_STATUS_META[s]?.label || s}</span>
                                {i < 1 && <div className={`mr-tl-line ${done && currentIdx > thisIdx ? "done" : ""}`}/>}
                              </div>
                            );
                          })}
                          {alert.status === "cancelled" && (
                            <>
                              <span className="mr-tl-dot-sep"/>
                              <div className="mr-tl-step done current">
                                <div className="mr-tl-dot"/>
                                <span className="mr-tl-label">{SOS_STATUS_META.cancelled.label}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <CitizenFooter />
    </div>
  );
}
