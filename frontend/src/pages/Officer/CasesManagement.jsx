import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Officer/CasesManagement.css";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import { api } from "../../lib/api";
import { formatOfficerDate } from "../../lib/officerPreferences";

// ── Icons ──
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
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconChevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

// ── Nav Items ──
const navItems = [
  { label: "Dashboard", icon: <IconGrid /> },
  { label: "Cases", icon: <IconFolder />, active: true },
  { label: "Criminal Records", icon: <IconBook /> },
  { label: "Crime Prediction", icon: <IconCpu /> },
  { label: "Demographics", icon: <IconUsers /> },
  { label: "Communication", icon: <IconMsg /> },
];

const DISTRICTS = ["All", "Colombo", "Gampaha", "Kandy", "Galle", "Jaffna", "Matara"];
const STATUSES  = ["All", "Submitted", "Under Investigation", "Assigned", "Solved", "Closed"];
const PRIORITIES = ["All", "High", "Medium", "Low"];
const PAGE_SIZE = 7;

const priorityClass = { High: "pri-high", Medium: "pri-medium", Low: "pri-low" };
const statusClass   = {
  Submitted: "st-submitted",
  "Under Investigation": "st-investigating",
  Assigned: "st-assigned",
  Solved: "st-solved",
  Closed: "st-closed",
};

const STATUS_LABEL = {
  submitted: "Submitted",
  under_review: "Under Investigation",
  assigned: "Assigned",
  resolved: "Solved",
  closed: "Closed",
};

const getPriorityFromStatus = (status) => {
  if (status === "submitted" || status === "under_review") return "High";
  if (status === "assigned") return "Medium";
  return "Low";
};

const formatDate = (d) => formatOfficerDate(d, { year: "numeric", month: "2-digit", day: "2-digit" });

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    underInvestigation: 0,
    solvedThisMonth: 0,
    highPriorityCount: 0,
  });
  const [search, setSearch]     = useState("");
  const [district, setDistrict] = useState("All");
  const [status, setStatus]     = useState("All");
  const [priority, setPriority] = useState("All");
  const [page, setPage]         = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCases = useCallback(async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        api.get("/reports/all?limit=500"),
        api.get("/reports/officer-stats"),
      ]);

      const mapped = (reportsRes.data?.data || []).map((r) => {
        const rawStatus = String(r.status || "submitted").trim().toLowerCase();
        return {
          _id: r._id,
          id: r.caseId,
          type: r.category,
          location: r.location?.address || "Unknown",
          priority: getPriorityFromStatus(rawStatus),
          status: STATUS_LABEL[rawStatus] || "Submitted",
          date: formatDate(r.submittedAt),
        };
      });

      setCases(mapped);
      setStats({
        totalReports: statsRes.data?.data?.totalReports ?? mapped.length,
        underInvestigation: statsRes.data?.data?.underInvestigation ?? 0,
        solvedThisMonth: statsRes.data?.data?.solvedThisMonth ?? 0,
        highPriorityCount: statsRes.data?.data?.highPriorityCount ?? 0,
      });
    } catch {
      setCases([]);
      setStats({ totalReports: 0, underInvestigation: 0, solvedThisMonth: 0, highPriorityCount: 0 });
    }
  }, []);

  useEffect(() => { loadCases(); }, [loadCases]);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.id.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
      const matchDistrict = district === "All" || c.location.toLowerCase().includes(district.toLowerCase());
      const matchStatus   = status === "All" || c.status === status;
      const matchPriority = priority === "All" || c.priority === priority;
      return matchSearch && matchDistrict && matchStatus && matchPriority;
    });
  }, [cases, search, district, status, priority]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = () => setPage(1);

  const handleDeleteCase = async () => {
    if (!deleteTarget?._id) return;
    try {
      setIsDeleting(true);
      await api.delete(`/reports/${deleteTarget._id}`);
      setCases((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
      await loadCases();
    } catch {
      alert("Failed to delete case. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const pageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="cases-page officer-with-sidebar">
      <OfficerSidebar />

      {/* ── Top Header ── */}
      <header className="dash-header">
        <div className="dash-header-brand">
          <span className="brand-icon">🛡</span>
          <span className="brand-name">CRIMSON</span>
        </div>
      </header>

      <div className="dash-body">
        {/* ── Main ── */}
        <main className="cases-main">
          {/* Page heading */}
          <div className="cases-toprow">
            <div>
              <h1 className="cases-title">Cases Management</h1>
              <p className="cases-subtitle">View and manage all reported crime cases</p>
            </div>
            <div className="cases-top-actions">
              <button className="btn-export">Export</button>
              <button className="btn-new-case">+ New Case</button>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-row">
            <div className="search-wrap">
              <span className="search-icon"><IconSearch /></span>
              <input
                className="search-input"
                type="text"
                placeholder="Search by case ID, location, or suspect name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select label="District" value={district} options={DISTRICTS} onChange={(v) => { setDistrict(v); handleFilter(); }} />
            <Select label="Status"   value={status}   options={STATUSES}   onChange={(v) => { setStatus(v);   handleFilter(); }} />
            <Select label="Priority" value={priority} options={PRIORITIES} onChange={(v) => { setPriority(v); handleFilter(); }} />
          </div>

          {/* Date range + apply */}
          <div className="date-filter-row">
            <button className="date-range-btn">
              <span className="date-range-icon"><IconCalendar /></span>
              Nov 1 – Nov 30, 2023
            </button>
            <button className="btn-apply-filters" onClick={handleFilter}>Apply Filters</button>
          </div>

          {/* Stat cards */}
          <div className="cases-stat-grid">
            <StatCard label="Total Cases"          value={String(stats.totalReports)}        sub="Live database count"   subColor="muted" />
            <StatCard label="Under Investigation"  value={String(stats.underInvestigation)}  sub="Active cases"         subColor="muted" />
            <StatCard label="Solved This Month"    value={String(stats.solvedThisMonth)}     sub="Resolved + closed"    subColor="green" />
            <StatCard label="High Priority"        value={String(stats.highPriorityCount)}    sub="Needs attention"      subColor="red"   />
          </div>

          {/* Table */}
          <div className="cases-table-wrap">
            <table className="cases-table">
              <thead>
                <tr>
                  <th>CASE ID</th>
                  <th>CRIME TYPE</th>
                  <th>LOCATION</th>
                  <th>PRIORITY</th>
                  <th>STATUS</th>
                  <th>DATE REPORTED</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="no-results">No cases match the current filters.</td></tr>
                ) : paginated.map((c) => (
                  <tr key={c.id} className="case-row-clickable" onClick={() => navigate(`/officer/report/${encodeURIComponent(c.id)}`)}>
                    <td><span className="case-id-link">{c.id}</span></td>
                    <td className="case-type-cell">{c.type}</td>
                    <td className="case-loc">{c.location}</td>
                    <td><span className={`pri-badge ${priorityClass[c.priority]}`}>{c.priority}</span></td>
                    <td><span className={`st-badge ${statusClass[c.status]}`}>{c.status}</span></td>
                    <td className="case-date">{c.date}</td>
                    <td className="case-action-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-delete-case"
                        title="Delete case"
                        aria-label={`Delete ${c.id}`}
                        onClick={() => setDeleteTarget(c)}
                      >
                        <IconTrash />
                        <span className="delete-text">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-row">
            <span className="pagination-info">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} cases
            </span>
            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >← Previous</button>
              {pageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="page-ellipsis">...</span>
                ) : (
                  <button
                    key={p}
                    className={`page-num${page === p ? " page-active" : ""}`}
                    onClick={() => setPage(p)}
                  >{p}</button>
                )
              )}
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >Next →</button>
            </div>
          </div>
        </main>
      </div>

      {deleteTarget && (
        <div className="delete-modal-overlay" onClick={() => !isDeleting && setDeleteTarget(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="delete-modal-title">Delete Case</h3>
            <p className="delete-modal-body">
              Are you sure you want to delete case <strong>{deleteTarget.id}</strong>? This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button className="btn-cancel-delete" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</button>
              <button className="btn-confirm-delete" onClick={handleDeleteCase} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──
function Select({ label, value, options, onChange }) {
  return (
    <div className="select-wrap">
      <select
        className="filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>{label}: {o}</option>
        ))}
      </select>
      <span className="select-chevron"><IconChevron /></span>
    </div>
  );
}

function StatCard({ label, value, sub, subColor }) {
  return (
    <div className="cases-stat-card">
      <span className="cases-stat-label">{label}</span>
      <span className="cases-stat-value">{value}</span>
      <span className={`cases-stat-sub sub-${subColor}`}>
        {subColor === "green" && <IconTrend />}
        {sub}
      </span>
    </div>
  );
}