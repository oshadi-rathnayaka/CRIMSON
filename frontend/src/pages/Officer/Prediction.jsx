import React, { useState, useEffect, useCallback } from "react";
import "../../styles/Officer/Prediction.css";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import { getForecast, getHotspots } from "../../api/analytics";
import { formatOfficerDate } from "../../lib/officerPreferences";

// ── Icons ─────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    shield:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    grid:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    folder:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
    user:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    activity:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    bar_chart:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    message:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    logout:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    sliders:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
    chevron_down: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    download:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    history:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 101.85-4.36L1 10"/></svg>,
    sparkles:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75L5 3z"/><path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z"/></svg>,
    trending_up:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    users:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    map:          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    shield_check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
    briefcase:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  };
  return icons[name] || null;
};

// ── Sidebar ───────────────────────────────────────────────────
const Sidebar = ({ active, setActive }) => {
  const navItems = [
    { id: "dashboard",   label: "Dashboard",        icon: "grid"      },
    { id: "cases",       label: "Cases",            icon: "folder"    },
    { id: "criminal",    label: "Criminal Records", icon: "user"      },
    { id: "prediction",  label: "Crime Prediction", icon: "activity"  },
    { id: "demographics",label: "Demographics",     icon: "bar_chart" },
    { id: "communication",label:"Communication",    icon: "message"   },
  ];
  return (
    <aside className="pd-sidebar">
      <div className="pd-sidebar-top">
        <span className="pd-brand-icon"><Icon name="shield" size={18} /></span>
        <span className="pd-brand-name">CRIMSON</span>
        <button className="pd-back-btn">Back To Home</button>
      </div>
      <div className="pd-officer-row">
        <img src="https://i.pravatar.cc/40?img=12" alt="Officer" className="pd-officer-img" />
        <span className="pd-officer-badge">Badge #4921</span>
      </div>
      <nav className="pd-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`pd-nav-item ${active === item.id ? "active" : ""}`}
            onClick={() => setActive(item.id)}
          >
            <span className="pd-nav-icon"><Icon name={item.icon} size={15} /></span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <button className="pd-logout">
        <Icon name="logout" size={15} />
        <span>Log Out</span>
      </button>
    </aside>
  );
};

// ── Risk level config ────────────────────────────────────────
const RISK_META = {
  CRITICAL: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", label: "CRITICAL" },
  HIGH:     { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", label: "HIGH"     },
  MEDIUM:   { color: "#eab308", bg: "#fefce8", border: "#fef08a", label: "MEDIUM"   },
  LOW:      { color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", label: "LOW"      },
};

// ── DBSCAN Cluster Panel ─────────────────────────────────────
const ClusterPanel = ({ clusters, totalIncidents, loading, error }) => {
  if (loading) return (
    <div className="pd-panel pd-cluster-panel">
      <div className="pd-chart-header" style={{marginBottom: 12}}>
        <span className="pd-section-title">DBSCAN Cluster Analysis</span>
      </div>
      <div className="pd-loading-state" style={{padding: "20px 0"}}>
        <div className="pd-spinner" />
        <p>Loading clusters…</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="pd-panel pd-cluster-panel">
      <div className="pd-chart-header"><span className="pd-section-title">DBSCAN Cluster Analysis</span></div>
      <div className="pd-error-banner" style={{marginTop: 10}}>⚠ {error}</div>
    </div>
  );
  if (!clusters?.length) return null;

  return (
    <div className="pd-panel pd-cluster-panel">
      <div className="pd-chart-header" style={{marginBottom: 14}}>
        <span className="pd-section-title">DBSCAN Cluster Analysis</span>
        <span className="pd-legend-label" style={{color: "#64748b"}}>
          {totalIncidents?.toLocaleString()} total incidents · {clusters.length} cluster{clusters.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="pd-cluster-list">
        {clusters.map(c => {
          const meta = RISK_META[c.risk_level] || RISK_META.LOW;
          return (
            <div
              key={c.cluster_id}
              className="pd-cluster-item"
              style={{ borderColor: meta.border, background: meta.bg }}
            >
              <div className="pd-cluster-top">
                <span className="pd-cluster-badge" style={{ background: meta.color }}>
                  {meta.label}
                </span>
                <span className="pd-cluster-id">Cluster #{c.cluster_id}</span>
                <span className="pd-cluster-incidents">
                  {c.incidents.toLocaleString()} incidents
                </span>
              </div>
              <div className="pd-cluster-grid">
                <div className="pd-cluster-cell">
                  <span className="pd-cluster-cell-label">TOP DISTRICT</span>
                  <span className="pd-cluster-cell-val">{c.top_district}</span>
                </div>
                <div className="pd-cluster-cell">
                  <span className="pd-cluster-cell-label">CRIME TYPE</span>
                  <span className="pd-cluster-cell-val">{c.top_crime}</span>
                </div>
                <div className="pd-cluster-cell">
                  <span className="pd-cluster-cell-label">LOCATION</span>
                  <span className="pd-cluster-cell-val">{c.top_location}</span>
                </div>
                <div className="pd-cluster-cell">
                  <span className="pd-cluster-cell-label">PEAK TIME</span>
                  <span className="pd-cluster-cell-val">{c.peak_time}</span>
                </div>
              </div>
              <div className="pd-cluster-center">
                <Icon name="map" size={11} />
                {c.center_lat.toFixed(4)}, {c.center_lng.toFixed(4)} (cluster centroid)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── District data ─────────────────────────────────────────────
const DISTRICT_DATA = {
  Colombo:        { population: 2324, stations: 45, unemployment: 4.8, poverty: 32, index: 72.4, change:  5.2,  barH: 90, pop: "2.3M",  area: "699 km²"   },
  Gampaha:        { population: 2297, stations: 36, unemployment: 3.9, poverty: 26, index: 58.1, change:  2.1,  barH: 68, pop: "2.3M",  area: "1386 km²"  },
  Kalutara:       { population: 1216, stations: 28, unemployment: 5.1, poverty: 35, index: 61.7, change: -1.3,  barH: 72, pop: "1.2M",  area: "1598 km²"  },
  Kandy:          { population: 1374, stations: 31, unemployment: 4.2, poverty: 28, index: 55.3, change:  3.8,  barH: 62, pop: "1.4M",  area: "1940 km²"  },
  Galle:          { population: 1063, stations: 25, unemployment: 6.0, poverty: 38, index: 63.8, change:  1.6,  barH: 74, pop: "1.1M",  area: "1652 km²"  },
  Matara:         { population:  814, stations: 22, unemployment: 5.5, poverty: 36, index: 59.2, change:  0.8,  barH: 65, pop: "0.8M",  area: "1270 km²"  },
  Hambantota:     { population:  600, stations: 18, unemployment: 6.2, poverty: 40, index: 54.6, change: -0.5,  barH: 58, pop: "0.6M",  area: "2609 km²"  },
  Ratnapura:      { population: 1088, stations: 20, unemployment: 5.8, poverty: 39, index: 56.3, change:  1.2,  barH: 60, pop: "1.1M",  area: "3275 km²"  },
  Kegalle:        { population:  841, stations: 19, unemployment: 5.3, poverty: 37, index: 52.8, change:  0.4,  barH: 55, pop: "0.8M",  area: "1693 km²"  },
  "Nuwara Eliya": { population:  755, stations: 17, unemployment: 6.8, poverty: 44, index: 50.1, change: -1.1,  barH: 51, pop: "0.8M",  area: "1741 km²"  },
  Badulla:        { population:  896, stations: 20, unemployment: 6.5, poverty: 43, index: 51.7, change:  0.2,  barH: 53, pop: "0.9M",  area: "2861 km²"  },
  Monaragala:     { population:  451, stations: 14, unemployment: 7.0, poverty: 48, index: 46.3, change: -0.7,  barH: 46, pop: "0.5M",  area: "5639 km²"  },
  Kurunegala:     { population: 1618, stations: 33, unemployment: 4.5, poverty: 30, index: 57.9, change:  2.5,  barH: 66, pop: "1.6M",  area: "4816 km²"  },
  Puttalam:       { population:  762, stations: 18, unemployment: 5.9, poverty: 41, index: 53.4, change:  0.6,  barH: 56, pop: "0.8M",  area: "3072 km²"  },
  Anuradhapura:   { population:  857, stations: 22, unemployment: 5.6, poverty: 38, index: 52.1, change:  1.0,  barH: 54, pop: "0.9M",  area: "7179 km²"  },
  Polonnaruwa:    { population:  406, stations: 13, unemployment: 5.4, poverty: 36, index: 49.8, change: -0.3,  barH: 49, pop: "0.4M",  area: "3293 km²"  },
  Ampara:         { population:  649, stations: 16, unemployment: 6.3, poverty: 42, index: 48.6, change: -0.9,  barH: 48, pop: "0.6M",  area: "4415 km²"  },
  Batticaloa:     { population:  529, stations: 15, unemployment: 7.2, poverty: 45, index: 47.2, change:  0.3,  barH: 47, pop: "0.5M",  area: "2854 km²"  },
  Trincomalee:    { population:  380, stations: 13, unemployment: 6.9, poverty: 44, index: 46.8, change: -0.6,  barH: 46, pop: "0.4M",  area: "2727 km²"  },
  Jaffna:         { population:  602, stations: 16, unemployment: 5.7, poverty: 37, index: 51.3, change:  1.4,  barH: 53, pop: "0.6M",  area: "1025 km²"  },
  Vavuniya:       { population:  172, stations: 10, unemployment: 7.5, poverty: 47, index: 44.9, change: -0.4,  barH: 43, pop: "0.2M",  area: "1967 km²"  },
  Mullaitivu:     { population:  122, stations:  8, unemployment: 8.1, poverty: 52, index: 42.3, change: -1.2,  barH: 40, pop: "0.1M",  area: "2617 km²"  },
  Kilinochchi:    { population:  119, stations:  9, unemployment: 7.8, poverty: 50, index: 43.1, change: -0.8,  barH: 41, pop: "0.1M",  area: "1205 km²"  },
};

const DISTRICTS = Object.keys(DISTRICT_DATA);

// Comparison districts always shown alongside selected
const COMPARISON = ["Gampaha", "Kalutara"];

// ── Predicted Index Panel ─────────────────────────────────────
const PredictedIndex = ({ index, change }) => {
  const isHigh = index >= 65;
  const isMid  = index >= 45 && index < 65;

  const riskLabel = isHigh ? "High Risk" : isMid ? "Moderate" : "Low Risk";
  const riskClass = isHigh ? "risk-high" : isMid ? "risk-moderate" : "risk-low";
  const barPct    = Math.min(index, 100);

  return (
    <div className="pd-panel pd-panel-index">
      <p className="pd-panel-eyebrow">PREDICTED INDEX</p>
      <div className="pd-index-row">
        <span className="pd-index-number">{index.toFixed(1)}</span>
        <span className="pd-index-denom">/100</span>
        <span className={`pd-risk-badge ${riskClass}`}>{riskLabel}</span>
      </div>
      <div className="pd-change-row">
        <span className={`pd-change-icon ${change >= 0 ? "up" : "down"}`}>
          <Icon name="trending_up" size={13} />
        </span>
        <span className={`pd-change-val ${change >= 0 ? "up" : "down"}`}>
          {change >= 0 ? "+" : ""}{change}%
        </span>
        <span className="pd-change-label">increase from last year</span>
      </div>
      <div className="pd-index-bar-track">
        <div
          className={`pd-index-bar-fill ${riskClass}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </div>
  );
};

// ── Key Contributing Factors ──────────────────────────────────
const factors = [
  { label: "Unemployment",       impact: "High Impact", impactClass: "impact-high",      icon: "briefcase"   },
  { label: "Population Density", impact: "Moderate",    impactClass: "impact-moderate",  icon: "users"       },
  { label: "Police Presence",    impact: "Mitigating",  impactClass: "impact-mitigating",icon: "shield_check"},
];

const KeyFactors = () => (
  <div className="pd-panel pd-panel-factors">
    <p className="pd-panel-eyebrow">KEY CONTRIBUTING FACTORS</p>
    <div className="pd-factors-list">
      {factors.map(f => (
        <div key={f.label} className="pd-factor-row">
          <span className={`pd-factor-icon-wrap ${f.impactClass}`}>
            <Icon name={f.icon} size={14} />
          </span>
          <span className="pd-factor-label">{f.label}</span>
          <span className={`pd-factor-impact ${f.impactClass}`}>{f.impact}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── District Comparison Bar Chart ─────────────────────────────
const DistrictComparison = ({ selected }) => {
  const bars = [selected, ...COMPARISON.filter(d => d !== selected)];

  return (
    <div className="pd-panel pd-panel-comparison">
      <div className="pd-comparison-header">
        <span className="pd-section-title">District Comparison</span>
        <div className="pd-legend">
          <span className="pd-legend-dot current" />
          <span className="pd-legend-label">Current</span>
          <span className="pd-legend-dot historical" />
          <span className="pd-legend-label">Historical Avg</span>
        </div>
      </div>
      <div className="pd-bar-chart">
        {bars.map((d, i) => {
          const data   = DISTRICT_DATA[d] || DISTRICT_DATA["Colombo"];
          const height = data.barH;
          const histH  = Math.round(height * 0.78);
          const isActive = i === 0;
          return (
            <div key={d} className="pd-bar-group">
              <div className="pd-bar-pair">
                <div
                  className={`pd-bar ${isActive ? "pd-bar-active" : "pd-bar-inactive"}`}
                  style={{ height: `${height}px` }}
                />
                <div
                  className="pd-bar pd-bar-hist"
                  style={{ height: `${histH}px` }}
                />
              </div>
              <span className={`pd-bar-label ${isActive ? "active" : ""}`}>{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── District Stats Footer ─────────────────────────────────────
const DistrictStats = ({ district }) => {
  const d = DISTRICT_DATA[district] || DISTRICT_DATA["Colombo"];
  return (
    <div className="pd-stats-row">
      <div className="pd-stat-block">
        <span className="pd-stat-icon pd-stat-blue"><Icon name="users" size={16} /></span>
        <div>
          <span className="pd-stat-label">POPULATION</span>
          <span className="pd-stat-value">{d.pop}</span>
        </div>
      </div>
      <div className="pd-stat-block">
        <span className="pd-stat-icon pd-stat-blue"><Icon name="map" size={16} /></span>
        <div>
          <span className="pd-stat-label">AREA SIZE</span>
          <span className="pd-stat-value">{d.area}</span>
        </div>
      </div>
      <div className="pd-stat-block">
        <span className="pd-stat-icon pd-stat-green"><Icon name="shield_check" size={16} /></span>
        <div>
          <span className="pd-stat-label">POLICE STATIONS</span>
          <span className="pd-stat-value">{d.stations}</span>
        </div>
      </div>
    </div>
  );
};

// ── Main Prediction Component ─────────────────────────────────
const Prediction = () => {
  const [district, setDistrict]       = useState("Colombo");
  const [steps, setSteps]             = useState(12);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [historical, setHistorical]   = useState([]);
  const [forecast, setForecast]       = useState([]);
  const [accuracy, setAccuracy]       = useState(null);
  const [clusters, setClusters]       = useState([]);
  const [totalInc, setTotalInc]       = useState(null);
  const [cLoading, setCLoading]       = useState(false);
  const [cError, setCError]           = useState(null);

  // ── Fetch from LSTM API ──────────────────────────────────────
  const runForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getForecast({ steps, district });
      const data = res.data;
      setHistorical(data.historical || []);
      setForecast(data.forecast   || []);
      setAccuracy(data.accuracy   || null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load LSTM forecast.");
    } finally {
      setLoading(false);
    }
  }, [steps, district]);

  useEffect(() => { runForecast(); }, [runForecast]);

  // ── Fetch DBSCAN clusters ────────────────────────────────────
  const loadClusters = useCallback(async () => {
    setCLoading(true);
    setCError(null);
    try {
      const res = await getHotspots({ district });
      setClusters(res.data.clusters || []);
      setTotalInc(res.data.total_incidents || 0);
    } catch {
      setCError("Failed to load cluster data.");
    } finally {
      setCLoading(false);
    }
  }, [district]);

  useEffect(() => { loadClusters(); }, [loadClusters]);

  // ── Derived stats from real LSTM output ─────────────────────
  const lastHistCount  = historical.length ? historical[historical.length - 1].count   : null;
  const nextMonthVal   = forecast.length   ? forecast[0].forecast                      : null;
  const lastForecastVal= forecast.length   ? forecast[forecast.length - 1].forecast    : null;
  const trend          = (lastHistCount != null && nextMonthVal != null)
    ? nextMonthVal - lastHistCount : 0;
  const trendPct       = lastHistCount
    ? ((trend / lastHistCount) * 100).toFixed(1) : "0.0";
  const isUp           = trend >= 0;

  const maxForecast    = forecast.length ? Math.max(...forecast.map(f => f.forecast)) : 0;
  const minForecast    = forecast.length ? Math.min(...forecast.map(f => f.forecast)) : 0;
  const avgForecast    = forecast.length
    ? (forecast.reduce((s, f) => s + f.forecast, 0) / forecast.length).toFixed(1) : 0;

  // Risk label based on next-month trend
  const riskLabel = trendPct >= 10 ? "High Risk"
    : trendPct >= 3  ? "Moderate"
    : trendPct >= 0  ? "Stable"
    : "Declining";
  const riskClass = trendPct >= 10 ? "risk-high"
    : trendPct >= 3  ? "risk-moderate"
    : "risk-low";

  // ── SVG Line Chart ───────────────────────────────────────────
  const ChartPanel = () => {
    const W = 660, H = 210, PAD = { top: 20, right: 20, bottom: 36, left: 44 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top  - PAD.bottom;

    const allPoints = [
      ...historical.map(h => ({ date: h.date, val: h.count,    type: "hist" })),
      ...forecast.map(f   => ({ date: f.date, val: f.forecast, type: "fore" })),
    ];
    if (!allPoints.length) return (
      <div className="pd-chart-empty">No data yet — run forecast</div>
    );

    const vals     = allPoints.map(p => p.val);
    const minV     = Math.min(...vals) * 0.9;
    const maxV     = Math.max(...vals) * 1.1;
    const scaleX   = (i) => PAD.left + (i / (allPoints.length - 1)) * chartW;
    const scaleY   = (v) => PAD.top  + chartH - ((v - minV) / (maxV - minV)) * chartH;

    const histPts  = allPoints.filter(p => p.type === "hist");
    const forePts  = allPoints.filter(p => p.type === "fore");
    const histIdx  = allPoints.findIndex(p => p.type === "fore") - 1;

    const toPolyline = (pts, startIdx) =>
      pts.map((p, i) => `${scaleX(startIdx + i)},${scaleY(p.val)}`).join(" ");

    const histLine  = toPolyline(histPts,  0);
    const fstIdx    = histPts.length > 0 ? histPts.length - 1 : 0;
    // connect forecast to last hist point
    const forePoints= [histPts[histPts.length - 1], ...forePts];
    const foreLine  = toPolyline(forePoints, fstIdx);

    // Area fill under forecast
    const foreArea  = [
      `${scaleX(fstIdx)},${scaleY(minV)}`,
      ...forePoints.map((p, i) => `${scaleX(fstIdx + i)},${scaleY(p.val)}`),
      `${scaleX(fstIdx + forePoints.length - 1)},${scaleY(minV)}`,
    ].join(" ");

    // Y-axis ticks
    const ticks = 4;
    const yTicks = Array.from({ length: ticks + 1 }, (_, i) =>
      minV + ((maxV - minV) / ticks) * i
    );

    // X-axis labels (every ~3 months)
    const xLabels = allPoints
      .map((p, i) => ({ i, date: p.date, type: p.type }))
      .filter((_, i) => i % 4 === 0 || i === allPoints.length - 1);

    const fmtDate = (d) => formatOfficerDate(d, { month: "short", year: "2-digit" });

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="pd-chart-svg">
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={scaleY(v)}
              x2={W - PAD.right} y2={scaleY(v)}
              stroke="#e2e8f0" strokeWidth="1"
            />
            <text x={PAD.left - 6} y={scaleY(v) + 4}
              textAnchor="end" fill="#94a3b8" fontSize="10">
              {Math.round(v)}
            </text>
          </g>
        ))}

        {/* Forecast shaded area */}
        <polygon points={foreArea} fill="#3b82f620" />

        {/* Vertical divider at forecast start */}
        <line
          x1={scaleX(fstIdx)} y1={PAD.top}
          x2={scaleX(fstIdx)} y2={PAD.top + chartH}
          stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3"
        />
        <text x={scaleX(fstIdx) + 4} y={PAD.top + 12}
          fill="#64748b" fontSize="9">FORECAST →</text>

        {/* Historical line */}
        <polyline points={histLine} fill="none"
          stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Forecast line */}
        <polyline points={foreLine} fill="none"
          stroke="#e8192c" strokeWidth="2" strokeDasharray="5 3"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Dot at transition */}
        <circle
          cx={scaleX(fstIdx)} cy={scaleY(histPts[histPts.length - 1]?.val ?? 0)}
          r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2"
        />

        {/* X-axis labels */}
        {xLabels.map(({ i, date, type }) => (
          <text key={i} x={scaleX(i)} y={H - 6}
            textAnchor="middle"
            fill={type === "fore" ? "#e8192c" : "#64748b"}
            fontSize="9">
            {fmtDate(date)}
          </text>
        ))}
      </svg>
    );
  };

  // ── Forecast Table ───────────────────────────────────────────
  const ForecastTable = () => (
    <div className="pd-forecast-table-wrap">
      <table className="pd-forecast-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Predicted Incidents</th>
            <th>vs Previous</th>
          </tr>
        </thead>
        <tbody>
          {forecast.map((f, i) => {
            const prev = i === 0
              ? (historical.length ? historical[historical.length - 1].count : f.forecast)
              : forecast[i - 1].forecast;
            const diff  = f.forecast - prev;
            const isInc = diff >= 0;
            return (
              <tr key={f.date}>
                <td>{formatOfficerDate(f.date, { month: "short", year: "numeric" })}</td>
                <td><strong>{Math.round(f.forecast)}</strong></td>
                <td className={isInc ? "td-up" : "td-down"}>
                  {isInc ? "▲" : "▼"} {Math.abs(diff).toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const distData = DISTRICT_DATA[district] || DISTRICT_DATA["Colombo"];

  return (
    <div className="pd-app officer-with-sidebar">
      <OfficerSidebar />

      <main className="pd-main">
        {/* Page header */}
        <div className="pd-page-header">
          <div className="pd-header-left">
            <span className="pd-ai-tag"><Icon name="sparkles" size={12} /> AI POWERED · LSTM</span>
            <h1 className="pd-page-title">Crime Rate Forecast</h1>
            <p className="pd-page-subtitle">
              LSTM neural network · {accuracy ? `${accuracy}% accuracy` : "Loading model…"} · Forecasting next {steps} months
            </p>
          </div>
          <div className="pd-header-actions">
            <button className="pd-action-btn" onClick={runForecast} disabled={loading}>
              <Icon name="history" size={14} /> {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="pd-error-banner">
            ⚠ {error}
          </div>
        )}

        <div className="pd-dashboard">

          {/* Left: Controls */}
          <div className="pd-left-col">
            <div className="pd-params-card">
              <div className="pd-params-header">
                <span className="pd-params-icon"><Icon name="sliders" size={15} /></span>
                <span className="pd-params-title">Forecast Parameters</span>
              </div>

              {/* District */}
              <div className="pd-field">
                <label className="pd-field-label">Select District</label>
                <div className="pd-select-wrap">
                  <select
                    className="pd-select"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                  >
                    {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <span className="pd-select-arrow"><Icon name="chevron_down" size={13} /></span>
                </div>
              </div>

              {/* Forecast steps */}
              <div className="pd-field">
                <label className="pd-field-label">Forecast Months</label>
                <div className="pd-select-wrap">
                  <select
                    className="pd-select"
                    value={steps}
                    onChange={e => setSteps(Number(e.target.value))}
                  >
                    {[3, 6, 12, 18, 24].map(n => (
                      <option key={n} value={n}>{n} months</option>
                    ))}
                  </select>
                  <span className="pd-select-arrow"><Icon name="chevron_down" size={13} /></span>
                </div>
              </div>

              <button
                className={`pd-predict-btn ${loading ? "loading" : ""}`}
                onClick={runForecast}
                disabled={loading}
              >
                <Icon name="sparkles" size={15} />
                {loading ? "Running LSTM…" : "Run Forecast"}
              </button>

              <p className="pd-model-note">
                LSTM model · Trained on 2015–2024 Sri Lanka crime data
                {accuracy && <> · <strong>{accuracy}% accuracy</strong></>}
              </p>

              {/* District context stats */}
              <div className="pd-district-context">
                <p className="pd-panel-eyebrow" style={{ marginBottom: 10 }}>DISTRICT CONTEXT</p>
                <div className="pd-ctx-row"><span>Population</span><strong>{distData.pop}</strong></div>
                <div className="pd-ctx-row"><span>Area</span><strong>{distData.area}</strong></div>
                <div className="pd-ctx-row"><span>Police Stations</span><strong>{distData.stations}</strong></div>
                <div className="pd-ctx-row"><span>Unemployment</span><strong>{distData.unemployment}%</strong></div>
                <div className="pd-ctx-row"><span>Poverty Index</span><strong>{distData.poverty}</strong></div>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="pd-right-col">

            {/* Summary cards */}
            {!loading && forecast.length > 0 && (
              <div className="pd-summary-cards">
                <div className="pd-summary-card">
                  <span className="pd-summary-eyebrow">NEXT MONTH</span>
                  <span className="pd-summary-value">{nextMonthVal != null ? Math.round(nextMonthVal) : "—"}</span>
                  <span className="pd-summary-sub">predicted incidents</span>
                </div>
                <div className="pd-summary-card">
                  <span className="pd-summary-eyebrow">TREND</span>
                  <span className={`pd-summary-value ${isUp ? "color-red" : "color-green"}`}>
                    {isUp ? "▲" : "▼"} {Math.abs(trendPct)}%
                  </span>
                  <span className="pd-summary-sub">vs last month</span>
                </div>
                <div className="pd-summary-card">
                  <span className="pd-summary-eyebrow">{steps}-MONTH AVG</span>
                  <span className="pd-summary-value">{avgForecast}</span>
                  <span className="pd-summary-sub">incidents / month</span>
                </div>
                <div className={`pd-summary-card ${riskClass}`}>
                  <span className="pd-summary-eyebrow">RISK LEVEL</span>
                  <span className="pd-summary-value">{riskLabel}</span>
                  <span className="pd-summary-sub">{district}</span>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="pd-loading-state">
                <div className="pd-spinner" />
                <p>Running LSTM model forecast…</p>
              </div>
            )}

            {/* Chart */}
            {!loading && (historical.length > 0 || forecast.length > 0) && (
              <div className="pd-panel pd-chart-panel">
                <div className="pd-chart-header">
                  <span className="pd-section-title">Monthly Crime Trend &amp; {steps}-Month LSTM Forecast</span>
                  <div className="pd-legend">
                    <span className="pd-legend-dot" style={{ background: "#3b82f6" }} />
                    <span className="pd-legend-label">Historical</span>
                    <span className="pd-legend-dot" style={{ background: "#e8192c" }} />
                    <span className="pd-legend-label">LSTM Forecast</span>
                  </div>
                </div>
                <ChartPanel />
              </div>
            )}

            {/* Forecast table */}
            {!loading && forecast.length > 0 && (
              <div className="pd-panel">
                <div className="pd-chart-header" style={{ marginBottom: 12 }}>
                  <span className="pd-section-title">Monthly Breakdown</span>
                  <span className="pd-legend-label" style={{ color: "#64748b" }}>
                    Peak: {Math.round(maxForecast)} &nbsp;|&nbsp; Low: {Math.round(minForecast)}
                  </span>
                </div>
                <ForecastTable />
              </div>
            )}

            {/* DBSCAN Cluster Panel */}
            <ClusterPanel
              clusters={clusters}
              totalIncidents={totalInc}
              loading={cLoading}
              error={cError}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Prediction;