import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Admin/Audit.css";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import { getAuditLogs } from "../../api/audit";

const PER_PAGE = 50;
const ROLE_OPTIONS = ["All Roles", "Admin", "Officer", "Citizen", "System"];
const DEFAULT_ACTION_TYPES = ["All Action Types"];
const STATUS_OPTIONS = ["All", "Success", "Error"];

function StatusIcon({ status }) {
  if (status === "success") {
    return (
      <svg className="status-icon status-icon--success" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="1.8" />
        <polyline points="9 12 11 14 15 10" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="status-icon status-icon--error" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="1.8" />
      <line x1="15" y1="9" x2="9" y2="15" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="9" x2="15" y2="15" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Audit() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [actionTypeFilter, setActionTypeFilter] = useState("All Action Types");
  const [actionTypeOptions, setActionTypeOptions] = useState(DEFAULT_ACTION_TYPES);
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAuditLogs({
          page: currentPage,
          limit: PER_PAGE,
          role: roleFilter,
          actionType: actionTypeFilter,
          status: statusFilter,
          search: search.trim() || null,
        });

        const responseData = res.data?.data || {};
        setLogs(responseData.logs || []);
        const remoteActionTypes = Array.isArray(responseData.actionTypes) ? responseData.actionTypes : [];
        const localActionTypes = (responseData.logs || []).map((item) => item?.action).filter(Boolean);
        const normalizedActionTypes = [
          "All Action Types",
          ...Array.from(new Set([...remoteActionTypes, ...localActionTypes])).filter((item) => item && item !== "All Action Types"),
        ];
        setActionTypeOptions(normalizedActionTypes);
        setTotalRecords(responseData.pagination?.total || 0);
        setTotalPages(responseData.pagination?.totalPages || 1);
      } catch (err) {
        const statusCode = err?.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          navigate("/admin/login", { replace: true });
          return;
        }

        setError("Failed to load audit logs from server.");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [currentPage, roleFilter, actionTypeFilter, search, statusFilter, refreshTick]);

  const pageNums = [];
  if (totalPages <= 5) {
    for (let p = 1; p <= totalPages; p += 1) pageNums.push(p);
  } else {
    pageNums.push(1);
    if (currentPage > 3) pageNums.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let p = start; p <= end; p += 1) pageNums.push(p);
    if (currentPage < totalPages - 2) pageNums.push("...");
    pageNums.push(totalPages);
  }

  const fromRecord = totalRecords === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const toRecord = Math.min(currentPage * PER_PAGE, totalRecords);

  return (
    <div className="audit-page admin-with-sidebar">
      <AdminSidebar />
      {/* Page Header */}
      <div className="audit-header">
        <div>
          <h1 className="audit-header__title">System Audit Logs</h1>
          <p className="audit-header__subtitle">
            Real-time monitoring of all system activities, case modifications, and officer actions across the CRIMSON platform.
          </p>
        </div>
        <div className="audit-header__actions">
          <button className="btn btn--ghost">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Date Range
          </button>
          <button className="btn btn--primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <div className="audit-filters__search-row">
          <div className="search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search by User, Action, Case ID, or IP Address..."
              value={search}
              onChange={(e) => {
                setCurrentPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="audit-filters__controls-row">
          <div className="filter-group">
            <label className="filter-label" htmlFor="audit-role-filter">Role</label>
            <select
              id="audit-role-filter"
              className="filter-select"
              value={roleFilter}
              onChange={(e) => {
                setCurrentPage(1);
                setRoleFilter(e.target.value);
              }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="audit-action-filter">Action Type</label>
            <select
              id="audit-action-filter"
              className="filter-select"
              value={actionTypeFilter}
              onChange={(e) => {
                setCurrentPage(1);
                setActionTypeFilter(e.target.value);
              }}
            >
              {actionTypeOptions.map((typeName) => (
                <option key={typeName} value={typeName}>{typeName}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="audit-status-filter">Status</label>
            <select
              id="audit-status-filter"
              className="filter-select"
              value={statusFilter}
              onChange={(e) => {
                setCurrentPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="refresh-group">
            <div className="filter-label" style={{ visibility: 'hidden', height: '1em' }}>&nbsp;</div>
            <button
              className="refresh-btn"
              title="Refresh"
              onClick={() => setRefreshTick((v) => v + 1)}
              disabled={loading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="notice" style={{ marginBottom: 14 }}>
          <div>
            <strong>Audit Logs Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="audit-table-wrap">
        <div className="audit-table">
          {/* Head */}
          <div className="audit-table__head">
            <div className="col col--timestamp">Timestamp</div>
            <div className="col col--user">User Entity</div>
            <div className="col col--role">Role</div>
            <div className="col col--action">Action Performed</div>
            <div className="col col--ip">IP Address</div>
            <div className="col col--status">Status</div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="audit-table__row">
              <div className="col" style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6b7280" }}>
                Loading audit logs...
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="audit-table__row">
              <div className="col" style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6b7280" }}>
                No audit records found.
              </div>
            </div>
          ) : logs.map((log) => (
            <div className="audit-table__row" key={log.id}>
              <div className="col col--timestamp">
                <span className="ts-date">{log.timestamp}</span>
                <span className="ts-time">{log.time}</span>
              </div>

              <div className="col col--user">
                <div className="avatar" style={{ background: log.color }}>
                  {log.initials}
                </div>
                <span className="user-name">{log.user}</span>
              </div>

              <div className="col col--role">
                <span className={`role-badge ${log.roleClass}`}>{log.role}</span>
              </div>

              <div className="col col--action">
                <span className={`action-title ${log.actionClass || ""}`}>{log.action}</span>
                {log.caseRef && <span className="case-ref">{log.caseRef}</span>}
                <span className="action-detail">{log.detail}</span>
              </div>

              <div className="col col--ip">
                <span className="ip-addr">{log.ip}</span>
              </div>

              <div className="col col--status">
                <StatusIcon status={log.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination-bar">
          <span className="pagination-info">
            Showing {fromRecord}–{toRecord} of <strong>{totalRecords.toLocaleString()}</strong> audit records
          </span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {pageNums.map((p, i) =>
              p === "..." ? (
                <span className="page-ellipsis" key={`e${i}`}>…</span>
              ) : (
                <button
                  key={p}
                  className={`page-btn ${currentPage === p ? "page-btn--active" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              )
            )}
            <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Cards */}
      <div className="audit-footer">
        <div className="compliance-card">
          <div className="compliance-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h4 className="compliance-card__title">Compliance Status</h4>
            <p className="compliance-card__body">
              System is currently compliant with SL Cyber Security Act 2023. Audit logs are tamper-proof and signed with ECC-256
              encryption. Logs older than 365 days are archived to secure storage every Sunday at 00:00.
            </p>
          </div>
        </div>

        <div className="storage-card">
          <div className="storage-card__label">
            <span>Storage Usage</span>
          </div>
          <div className="storage-bar-wrap">
            <div className="storage-bar">
              <div className="storage-bar__fill" style={{ width: "65%" }} />
            </div>
          </div>
          <div className="storage-card__meta">
            <span>650GB used</span>
            <span>1TB Limit</span>
          </div>
        </div>
      </div>
    </div>
  );
}