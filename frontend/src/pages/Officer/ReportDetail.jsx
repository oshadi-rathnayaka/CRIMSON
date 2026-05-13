import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import { api } from "../../lib/api";
import "../../styles/Officer/ReportDetail.css";
import { formatOfficerDateTime } from "../../lib/officerPreferences";

/* ── status config ── */
const STATUS_META = {
  submitted:    { label: "Submitted",    color: "#6b7280", bg: "#f3f4f6" },
  under_review: { label: "Under Review", color: "#d97706", bg: "#fef3c7" },
  assigned:     { label: "Assigned",     color: "#2563eb", bg: "#bfdbfe" },
  resolved:     { label: "Resolved",     color: "#16a34a", bg: "#dcfce7" },
  closed:       { label: "Closed",       color: "#9ca3af", bg: "#f3f4f6" },
};

const STATUSES = ["submitted", "under_review", "assigned", "resolved", "closed"];

const formatDateTime = (d) =>
  formatOfficerDateTime(
    d,
    { year: "numeric", month: "2-digit", day: "2-digit" },
    { hour: "2-digit", minute: "2-digit" }
  );

/* ── icons ── */
const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function ReportDetail() {
  const { caseId } = useParams();
  const navigate   = useNavigate();

  const [report,       setReport]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [statusVal,    setStatusVal]    = useState("");
  const [updating,     setUpdating]     = useState(false);
  const [updateMsg,    setUpdateMsg]    = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reports/detail/${caseId}`);
        const r   = res.data.data;
        setReport(r);
        setStatusVal(r.status);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load report.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [caseId]);

  const handleStatusUpdate = async () => {
    if (!statusVal || statusVal === report.status) return;
    setUpdating(true);
    setUpdateMsg("");
    try {
      const res = await api.patch(`/reports/detail/${caseId}/status`, { status: statusVal });
      setReport(res.data.data);
      setUpdateMsg("Status updated successfully.");
      setTimeout(() => setUpdateMsg(""), 3000);
    } catch (err) {
      setUpdateMsg(err?.response?.data?.message || "Update failed.");
    } finally {
      setUpdating(false);
    }
  };

  /* ── render states ── */
  if (loading) {
    return (
      <div className="rd-page officer-with-sidebar">
        <OfficerSidebar />
        <main className="rd-main">
          <div className="rd-loading">
            <span className="rd-spinner" />
            Loading report…
          </div>
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rd-page officer-with-sidebar">
        <OfficerSidebar />
        <main className="rd-main">
          <div className="rd-error">
            <p>{error || "Report not found."}</p>
            <button className="rd-btn-back" onClick={() => navigate("/officer/dashboard")}>
              <ArrowLeft /> Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const sm     = STATUS_META[report.status] || STATUS_META.submitted;
  const cities = report.files || [];

  return (
    <div className="rd-page officer-with-sidebar">
      <OfficerSidebar />

      <main className="rd-main">

        {/* ── Top bar ── */}
        <div className="rd-topbar">
          <button className="rd-btn-back" onClick={() => navigate("/officer/dashboard")}>
            <ArrowLeft /> Back
          </button>
          <div className="rd-topbar-title">
            <h1 className="rd-title">Citizen Report</h1>
            <span className="rd-caseid">{report.caseId}</span>
          </div>
          <span className="rd-status-badge" style={{ background: sm.bg, color: sm.color }}>
            {sm.label}
          </span>
        </div>

        {/* ── Body grid ── */}
        <div className="rd-body">

          {/* ── Left — main info ── */}
          <div className="rd-col-main">

            {/* Meta bar */}
            <div className="rd-meta-bar">
              <span className="rd-meta-item">
                <PinIcon />
                {report.location?.address || "Unknown location"}
              </span>
              <span className="rd-meta-item">
                <ClockIcon />
                Submitted {formatDateTime(report.submittedAt)}
              </span>
              {report.userId && (
                <span className="rd-meta-item">
                  <UserIcon />
                  {report.userId.fullName || "Unknown citizen"}
                  {report.userId.email && (
                    <span className="rd-meta-email">&nbsp;·&nbsp;{report.userId.email}</span>
                  )}
                </span>
              )}
            </div>

            {/* Category card */}
            <div className="rd-card">
              <div className="rd-card-header">
                <span className="rd-card-title">Category</span>
              </div>
              <span className="rd-category-pill">{report.category}</span>
            </div>

            {/* Description card */}
            <div className="rd-card">
              <div className="rd-card-header">
                <span className="rd-card-title">Report Description</span>
              </div>
              <p className="rd-description">{report.description}</p>
            </div>

            {/* Location card */}
            {(report.location?.latitude || report.location?.address) && (
              <div className="rd-card">
                <div className="rd-card-header">
                  <span className="rd-card-title">Location Details</span>
                </div>
                <div className="rd-location-grid">
                  <div className="rd-location-field">
                    <span className="rd-location-label">Address</span>
                    <span className="rd-location-value">{report.location.address || "—"}</span>
                  </div>
                  {report.location.latitude && (
                    <div className="rd-location-field">
                      <span className="rd-location-label">Coordinates</span>
                      <span className="rd-location-value">
                        {report.location.latitude.toFixed(5)}, {report.location.longitude?.toFixed(5)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attached files */}
            {cities.length > 0 && (
              <div className="rd-card">
                <div className="rd-card-header">
                  <span className="rd-card-title">Attached Files</span>
                  <span className="rd-file-count">{cities.length} file{cities.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="rd-files-list">
                  {cities.map((f, i) => (
                    <div key={i} className="rd-file-item">
                      <div className="rd-file-icon"><FileIcon /></div>
                      <div className="rd-file-info">
                        <span className="rd-file-name">{f.name || "Unnamed file"}</span>
                        {f.size && (
                          <span className="rd-file-size">{(f.size / 1024).toFixed(1)} KB</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right — actions sidebar ── */}
          <div className="rd-col-side">

            {/* Citizen info */}
            {report.userId && (
              <div className="rd-card">
                <div className="rd-card-header">
                  <span className="rd-card-title">Submitted By</span>
                </div>
                <div className="rd-citizen-row">
                  <div className="rd-citizen-avatar">
                    {(report.userId.fullName || "?")[0].toUpperCase()}
                  </div>
                  <div className="rd-citizen-info">
                    <span className="rd-citizen-name">{report.userId.fullName || "Unknown"}</span>
                    <span className="rd-citizen-email">{report.userId.email || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status update */}
            <div className="rd-card">
              <div className="rd-card-header">
                <span className="rd-card-title">Update Status</span>
              </div>
              <div className="rd-status-list">
                {STATUSES.map((s) => {
                  const m = STATUS_META[s];
                  return (
                    <label
                      key={s}
                      className={`rd-status-option ${statusVal === s ? "rd-status-option--active" : ""}`}
                      style={statusVal === s ? { borderColor: m.color, background: m.bg } : {}}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={statusVal === s}
                        onChange={() => setStatusVal(s)}
                      />
                      <span className="rd-status-dot" style={{ background: m.color }} />
                      <span className="rd-status-label" style={statusVal === s ? { color: m.color } : {}}>
                        {m.label}
                      </span>
                      {statusVal === s && (
                        <span className="rd-status-check" style={{ color: m.color }}>
                          <CheckIcon />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {updateMsg && (
                <p className={`rd-update-msg ${updateMsg.includes("success") ? "rd-update-msg--ok" : "rd-update-msg--err"}`}>
                  {updateMsg}
                </p>
              )}
              <button
                className="rd-btn-update"
                onClick={handleStatusUpdate}
                disabled={updating || statusVal === report.status}
              >
                {updating ? "Updating…" : "Save Status"}
              </button>
            </div>

            {/* Case meta summary */}
            <div className="rd-card rd-summary-card">
              <div className="rd-card-header">
                <span className="rd-card-title">Case Summary</span>
              </div>
              <table className="rd-summary-table">
                <tbody>
                  <tr>
                    <td className="rd-st-label">Case ID</td>
                    <td className="rd-st-value rd-monospace">{report.caseId}</td>
                  </tr>
                  <tr>
                    <td className="rd-st-label">Category</td>
                    <td className="rd-st-value">{report.category}</td>
                  </tr>
                  <tr>
                    <td className="rd-st-label">Status</td>
                    <td className="rd-st-value">
                      <span style={{ color: sm.color, fontWeight: 600 }}>{sm.label}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="rd-st-label">Submitted</td>
                    <td className="rd-st-value">{formatDateTime(report.submittedAt)}</td>
                  </tr>
                  <tr>
                    <td className="rd-st-label">Files</td>
                    <td className="rd-st-value">{cities.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
