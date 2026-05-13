import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Admin/SystemHealth.css";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import { exportSystemHealthReport, getSystemHealthOverview } from "../../api/systemHealth";

const INITIAL_METRICS = {
  cpu: 0,
  memory: 0,
  storage: 0,
  network: 0,
};

const INITIAL_STORAGE = {
  usedLabel: "0 GB used of 1000 GB",
  usedPct: 0,
  breakdown: [],
};

const INITIAL_SERVICE_SUMMARY = {
  total: 0,
  operational: 0,
  degraded: 0,
  offline: 0,
};

const INITIAL_INCIDENT_SUMMARY = {
  total: 0,
  active: 0,
  critical: 0,
  warning: 0,
  info: 0,
};

function StatusPill({ status }) {
  const map = {
    operational: { label: "Operational", cls: "pill--green" },
    degraded: { label: "Degraded", cls: "pill--yellow" },
    offline: { label: "Offline", cls: "pill--red" },
  };
  const { label, cls } = map[status] || map.operational;
  return <span className={`status-pill ${cls}`}><span className="pill-dot" />{label}</span>;
}

function GaugeBar({ value, color }) {
  const danger = value >= 85;
  const warning = value >= 65;
  const barColor = danger ? "#dc2626" : warning ? "#f59e0b" : color;
  return (
    <div className="gauge-bar-wrap">
      <div className="gauge-bar">
        <div className="gauge-bar__fill" style={{ width: `${value}%`, background: barColor }} />
      </div>
      <span className="gauge-pct" style={{ color: barColor }}>{value}%</span>
    </div>
  );
}

function SeverityIcon({ severity }) {
  if (severity === "critical") {
    return (
      <div className="incident-icon incident-icon--critical">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8">
          <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
    );
  }

  if (severity === "warning") {
    return (
      <div className="incident-icon incident-icon--warning">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    );
  }

  return (
    <div className="incident-icon incident-icon--info">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </div>
  );
}

export default function SystemHealth() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [stats, setStats] = useState([]);
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [serviceSummary, setServiceSummary] = useState(INITIAL_SERVICE_SUMMARY);
  const [incidentSummary, setIncidentSummary] = useState(INITIAL_INCIDENT_SUMMARY);
  const [storage, setStorage] = useState(INITIAL_STORAGE);
  const [compliance, setCompliance] = useState({ title: "Compliance Status", body: "" });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadOverview = async ({ asRefresh = false } = {}) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const res = await getSystemHealthOverview();
      const data = res.data?.data || {};
      const servicesData = data.services || [];
      const allIncidents = data.incidents || [];

      setMetrics({
        cpu: Math.round((data.resourceUtilization?.cpu ?? data.metrics?.cpu) || 0),
        memory: Math.round((data.resourceUtilization?.memory ?? data.metrics?.memory) || 0),
        storage: Math.round((data.resourceUtilization?.storage ?? data.metrics?.storage) || 0),
        network: Math.round((data.resourceUtilization?.network ?? data.metrics?.network) || 0),
      });

      setStats(data.stats || []);
      setServices(servicesData);
      setServiceSummary(
        data.serviceStatusSummary || {
          total: servicesData.length,
          operational: servicesData.filter((s) => s.status === "operational").length,
          degraded: servicesData.filter((s) => s.status === "degraded").length,
          offline: servicesData.filter((s) => s.status === "offline").length,
        }
      );

      setIncidents(data.activeIncidents || allIncidents);
      setIncidentSummary(
        data.incidentSummary || {
          total: allIncidents.length,
          active: allIncidents.filter((i) => i.severity === "critical" || i.severity === "warning").length,
          critical: allIncidents.filter((i) => i.severity === "critical").length,
          warning: allIncidents.filter((i) => i.severity === "warning").length,
          info: allIncidents.filter((i) => i.severity === "info").length,
        }
      );

      setStorage(data.storageBreakdown || data.storage || INITIAL_STORAGE);
      setCompliance(data.complianceStatus || data.compliance || { title: "Compliance Status", body: "" });
      setLastRefresh(new Date(data.lastUpdated || Date.now()));
    } catch (err) {
      const statusCode = err?.response?.status;
      if (statusCode === 401 || statusCode === 403) {
        navigate("/admin/login", { replace: true });
        return;
      }

      setError("Failed to load system health data from backend.");
    } finally {
      if (asRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      loadOverview({ asRefresh: true });
    }, 30000);

    return () => clearInterval(id);
  }, []);

  const handleRefresh = async () => {
    await loadOverview({ asRefresh: true });
  };

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const res = await exportSystemHealthReport();
      const fileName = res.data?.data?.fileName || `system_health_report_${Date.now()}.json`;
      const report = res.data?.data?.report || {};

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const statusCode = err?.response?.status;
      if (statusCode === 401 || statusCode === 403) {
        navigate("/admin/login", { replace: true });
        return;
      }

      setError("Failed to export system health report.");
    } finally {
      setExporting(false);
    }
  };

  const gaugeMeta = [
    { key: "cpu", label: "CPU Usage", color: "#6366f1", icon: "CPU" },
    { key: "memory", label: "Memory (RAM)", color: "#3b82f6", icon: "RAM" },
    { key: "storage", label: "Storage", color: "#10b981", icon: "DSK" },
    { key: "network", label: "Network I/O", color: "#f59e0b", icon: "NET" },
  ];

  return (
    <div className="sh-page admin-with-sidebar">
      <AdminSidebar />

      <div className="sh-header">
        <div>
          <div className="sh-header__eyebrow">
            <span className="live-dot" />
            LIVE MONITORING
          </div>
          <h1 className="sh-header__title">System Health</h1>
          <p className="sh-header__sub">
            Real-time infrastructure diagnostics, service status, and performance metrics across all CRIMSON
            deployment nodes.
          </p>
        </div>
        <div className="sh-header__actions">
          <span className="sh-refresh-time">
            Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <button className={`btn btn--ghost ${refreshing ? "btn--spinning" : ""}`} onClick={handleRefresh} disabled={refreshing || loading}>
            <svg className={refreshing ? "spin" : ""} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
          <button className="btn btn--primary" onClick={handleExport} disabled={exporting || loading}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? "Exporting..." : "Export Report"}
          </button>
        </div>
      </div>

      {error && (
        <div className="compliance-card" style={{ marginBottom: 14 }}>
          <div>
            <div className="compliance-card__title">Backend Error</div>
            <p className="compliance-card__body">{error}</p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        {(stats.length > 0 ? stats : [
          { label: "Total Records Stored", value: "...", sub: "Loading" },
          { label: "Active Sessions", value: "...", sub: "Loading" },
          { label: "API Requests / hr", value: "...", sub: "Loading" },
          { label: "System Uptime", value: "...", sub: "Loading" },
        ]).map((s) => (
          <div className="stat-card" key={s.label}>
            <span className="stat-card__label">{s.label}</span>
            <span className="stat-card__value">{s.value}</span>
            <span className="stat-card__sub">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="sh-grid">
        <div className="sh-col sh-col--wide">
          <div className="sh-card">
            <div className="sh-card__head">
              <h2 className="sh-card__title">Resource Utilization</h2>
              <span className="sh-card__badge sh-card__badge--live">LIVE</span>
            </div>
            <div className="gauges-grid">
              {gaugeMeta.map(({ key, label, color, icon }) => (
                <div className="gauge-item" key={key}>
                  <div className="gauge-item__top">
                    <span className="gauge-item__icon">{icon}</span>
                    <span className="gauge-item__label">{label}</span>
                  </div>
                  <GaugeBar value={Math.round(metrics[key] || 0)} color={color} />
                </div>
              ))}
            </div>
          </div>

          <div className="sh-card">
            <div className="sh-card__head">
              <h2 className="sh-card__title">Service Status</h2>
              <div className="service-summary">
                <span className="svc-count svc-count--green">{serviceSummary.operational} Operational</span>
                <span className="svc-count svc-count--yellow">{serviceSummary.degraded} Degraded</span>
                <span className="svc-count svc-count--red">{serviceSummary.offline} Offline</span>
              </div>
            </div>

            <div className="svc-table">
              <div className="svc-table__head">
                <div className="scol scol--name">Service</div>
                <div className="scol scol--status">Status</div>
                <div className="scol scol--uptime">Uptime</div>
                <div className="scol scol--latency">Latency</div>
                <div className="scol scol--region">Region</div>
              </div>
              {services.map((svc) => (
                <div className={`svc-table__row svc-table__row--${svc.status}`} key={svc.id}>
                  <div className="scol scol--name">
                    <span className="svc-name">{svc.name}</span>
                  </div>
                  <div className="scol scol--status">
                    <StatusPill status={svc.status} />
                  </div>
                  <div className="scol scol--uptime">
                    <span className="svc-uptime">{svc.uptime}</span>
                  </div>
                  <div className="scol scol--latency">
                    <span className={`svc-latency ${svc.status === "degraded" ? "svc-latency--high" : ""}`}>
                      {svc.latency}
                    </span>
                  </div>
                  <div className="scol scol--region">
                    <span className="svc-region">{svc.region}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sh-col sh-col--narrow">
          <div className="sh-card">
            <div className="sh-card__head">
              <h2 className="sh-card__title">Active Incidents</h2>
              {incidentSummary.active > 0 && (
                <span className="sh-card__badge sh-card__badge--alert">{incidentSummary.active} Active</span>
              )}
            </div>
            <div className="incidents-list">
              {incidents.length === 0 ? (
                <div className="incident-item" key="no-incidents">
                  <SeverityIcon severity="info" />
                  <div className="incident-body">
                    <div className="incident-title">No Active Incidents</div>
                    <div className="incident-time">All monitored services are currently stable.</div>
                  </div>
                </div>
              ) : (
                incidents.map((inc) => (
                  <div className="incident-item" key={inc.id}>
                    <SeverityIcon severity={inc.severity} />
                    <div className="incident-body">
                      <div className="incident-title">{inc.title}</div>
                      <div className="incident-time">{inc.time}</div>
                      <div className="incident-desc">{inc.desc}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sh-card">
            <h2 className="sh-card__title" style={{ marginBottom: 16 }}>Storage Breakdown</h2>
            <div className="storage-items">
              {storage.breakdown.map((item) => (
                <div className="storage-item" key={item.label}>
                  <div className="storage-item__top">
                    <div className="storage-item__dot" style={{ background: item.color }} />
                    <span className="storage-item__label">{item.label}</span>
                    <span className="storage-item__pct">{item.pct}%</span>
                  </div>
                  <div className="storage-track">
                    <div className="storage-track__fill" style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="storage-total">
              <span>{storage.usedLabel}</span>
              <span className="storage-total__pct">{storage.usedPct}%</span>
            </div>
          </div>

          <div className="compliance-card">
            <div className="compliance-card__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div className="compliance-card__title">{compliance.title || "Compliance Status"}</div>
              <p className="compliance-card__body">
                {compliance.body || "Compliance details are currently unavailable."}
              </p>
              {typeof compliance.score === "number" && (
                <p className="compliance-card__body" style={{ marginTop: 6, fontWeight: 600 }}>
                  Score: {compliance.score}/100 ({String(compliance.status || "unknown").toUpperCase()})
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
