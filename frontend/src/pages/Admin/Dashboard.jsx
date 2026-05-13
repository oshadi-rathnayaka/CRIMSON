import { useState, useEffect, useCallback, useMemo } from "react";
import "../../styles/Admin/Dashboard.css";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import { getForecast, getVictimization } from "../../api/analytics";
import { getAdminDashboardStats } from "../../api/adminDashboard";

// ── Mock Data ──────────────────────────────────────────────
const STAT_CARDS = [
  {
    icon: "users",
    label: "Total Registered Users",
    value: "52,847",
    delta: "+2.4%",
    positive: true,
  },
  {
    icon: "shield",
    label: "Active Police Officers",
    value: "4,527",
    delta: "+1.2%",
    positive: true,
  },
  {
    icon: "alert",
    label: "Total Crime Reports",
    value: "12,450",
    delta: "+0.8%",
    positive: false,
  },
  {
    icon: "server",
    label: "System Uptime",
    value: "99.98%",
    delta: "+0.01%",
    positive: true,
  },
];

const SECURITY_ALERTS = [
  {
    id: 1,
    level: "critical",
    tag: "CRITICAL WARNING",
    title: "Multiple Failed Logins",
    desc: "12 attempts detected from IP 192.168.1.104",
    icon: "lock",
  },
  {
    id: 2,
    level: "warning",
    tag: "SUSPICIOUS ACTIVITY",
    title: "Unauthorized IP Attempt",
    desc: "Cross-regional login bypass attempt blocked.",
    icon: "warning",
  },
];

const ACTIVITY_LOG = [
  {
    id: 1,
    avatar: "KJ",
    avatarColor: "#2563eb",
    name: "Kasun Jayawardena",
    action: "updated Role Permissions",
    time: "14 minutes ago",
    category: "System Settings",
  },
  {
    id: 2,
    avatar: "AS",
    avatarColor: "#6b7280",
    name: "Automated Sync",
    action: "completed for Police DB",
    time: "2 hours ago",
    category: "Database",
  },
  {
    id: 3,
    avatar: "SP",
    avatarColor: "#9ca3af",
    name: "Samantha Perera",
    action: "generated Crime Audit",
    time: "Yesterday",
    category: "Reports",
  },
];

// ── Districts List ────────────────────────────────────────
const SL_DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Galle","Matara",
  "Hambantota","Ratnapura","Kegalle","Nuwara Eliya","Badulla",
  "Monaragala","Kurunegala","Puttalam","Anuradhapura","Polonnaruwa",
  "Ampara","Batticaloa","Trincomalee","Jaffna","Vavuniya",
  "Mullaitivu","Kilinochchi",
];

// ── LSTM Forecast Widget ───────────────────────────────────
function ForecastWidget() {
  const [district, setDistrict]   = useState("Colombo");
  const [steps, setSteps]         = useState(12);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getForecast({ steps, district });
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load forecast");
    } finally {
      setLoading(false);
    }
  }, [district, steps]);

  useEffect(() => { load(); }, [load]);

  // ── Chart ──────────────────────────────────────────────
  function ForecastChart({ historical, forecast }) {
    const W = 820, H = 230;
    const pad = { t: 16, r: 24, b: 44, l: 48 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;

    const hist  = historical.slice(-12);
    const all   = [
      ...hist.map(p => p.count),
      ...forecast.map(p => p.forecast),
    ];
    const maxV = Math.max(...all);
    const minV = Math.max(0, Math.min(...all) - 1);
    const range = maxV - minV || 1;
    const total = hist.length + forecast.length;

    const px = (i) => pad.l + (i / (total - 1)) * cw;
    const py = (v) => pad.t + ch - ((v - minV) / range) * ch;

    const hPts = hist.map((p, i) => ({ x: px(i), y: py(p.count) }));
    const fPts = forecast.map((p, i) => ({ x: px(hist.length - 1 + i), y: py(p.forecast) }));

    function bezier(pts) {
      if (!pts.length) return "";
      let d = `M${pts[0].x},${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i-1,0)];
        const p1 = pts[i];
        const p2 = pts[i+1];
        const p3 = pts[Math.min(i+2,pts.length-1)];
        const cp1x = p1.x + (p2.x-p0.x)/6;
        const cp1y = p1.y + (p2.y-p0.y)/6;
        const cp2x = p2.x - (p3.x-p1.x)/6;
        const cp2y = p2.y - (p3.y-p1.y)/6;
        d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
      }
      return d;
    }

    const hLine = bezier(hPts);
    const fLine = fPts.length > 1 ? bezier(fPts) : "";
    const hArea = hLine + ` L${hPts[hPts.length-1].x},${pad.t+ch} L${hPts[0].x},${pad.t+ch} Z`;
    const fArea = fLine
      ? fLine + ` L${fPts[fPts.length-1].x},${pad.t+ch} L${fPts[0].x},${pad.t+ch} Z`
      : "";

    const yTicks = [0.25, 0.5, 0.75, 1].map(f => ({ v: minV + range * f, y: py(minV + range * f) }));

    // X labels: every 3rd month
    const allDates = [
      ...hist.map(p => p.date),
      ...forecast.map(p => p.date),
    ];
    const xLabels = allDates
      .map((d, i) => ({ i, label: d.slice(0,7) }))
      .filter((_, i) => i % 3 === 0);

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="fc-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="fcHistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="fcFcstGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map((t,i) => (
          <g key={i}>
            <line x1={pad.l} y1={t.y} x2={pad.l+cw} y2={t.y} stroke="#e2e5ea" strokeWidth="1"/>
            <text x={pad.l-6} y={t.y+4} textAnchor="end" className="fc-axis-lbl">
              {Math.round(t.v)}
            </text>
          </g>
        ))}

        {/* Divider between historical and forecast */}
        {hPts.length > 0 && (
          <line
            x1={hPts[hPts.length-1].x} y1={pad.t}
            x2={hPts[hPts.length-1].x} y2={pad.t+ch}
            stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3"
          />
        )}

        {/* Historical area + line */}
        {hArea && <path d={hArea} fill="url(#fcHistGrad)"/>}
        {hLine && <path d={hLine} fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round"/>}

        {/* Forecast area + line */}
        {fArea && <path d={fArea} fill="url(#fcFcstGrad)"/>}
        {fLine && <path d={fLine} fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="6 3"/>}

        {/* X labels */}
        {xLabels.map(({i, label}) => (
          <text key={i} x={px(i)} y={H-8} textAnchor="middle" className="fc-axis-lbl">{label}</text>
        ))}
      </svg>
    );
  }

  // ── Summary metrics ────────────────────────────────────
  let nextMonth = "—", trendPct = "—", avgForecast = "—", trendPos = true;
  if (data?.forecast?.length) {
    const f = data.forecast;
    nextMonth = Math.round(f[0].forecast);
    const last = data.historical?.slice(-1)[0]?.count || f[0].forecast;
    trendPct = (((f[0].forecast - last) / (last || 1)) * 100).toFixed(1);
    trendPos = parseFloat(trendPct) <= 0;
    avgForecast = Math.round(f.reduce((s, x) => s + x.forecast, 0) / f.length);
  }

  return (
    <div className="fc-card">
      {/* Header */}
      <div className="fc-header">
        <div className="fc-title-block">
          <div className="fc-title-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span className="fc-title">LSTM Crime Forecast</span>
            <span className="fc-badge">98.62% accuracy</span>
          </div>
          <p className="fc-subtitle">Next {steps} months predicted crime volume by district</p>
        </div>
        <div className="fc-controls">
          <select
            className="fc-select"
            value={district}
            onChange={e => setDistrict(e.target.value)}
          >
            {SL_DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select
            className="fc-select"
            value={steps}
            onChange={e => setSteps(Number(e.target.value))}
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
            <option value={18}>18 Months</option>
            <option value={24}>24 Months</option>
          </select>
          <button className="fc-refresh-btn" onClick={load} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      {loading && (
        <div className="fc-loading">
          <div className="fc-spinner"/>
          <span>Loading forecast…</span>
        </div>
      )}
      {error && !loading && (
        <div className="fc-error">⚠ {error}</div>
      )}
      {data && !loading && !error && (
        <>
          {/* Metrics row */}
          <div className="fc-metrics">
            <div className="fc-metric">
              <p className="fc-metric-label">NEXT MONTH</p>
              <p className="fc-metric-val">{nextMonth}</p>
              <p className="fc-metric-sub">predicted incidents</p>
            </div>
            <div className="fc-metric">
              <p className="fc-metric-label">TREND</p>
              <p className={`fc-metric-val fc-trend-${trendPos ? 'pos' : 'neg'}`}>
                {trendPos ? "▼" : "▲"} {Math.abs(trendPct)}%
              </p>
              <p className="fc-metric-sub">vs last recorded month</p>
            </div>
            <div className="fc-metric">
              <p className="fc-metric-label">{steps}-MONTH AVG</p>
              <p className="fc-metric-val">{avgForecast}</p>
              <p className="fc-metric-sub">incidents / month</p>
            </div>
            <div className="fc-metric">
              <p className="fc-metric-label">DISTRICT</p>
              <p className="fc-metric-val fc-district">{district}</p>
              <p className="fc-metric-sub">selected region</p>
            </div>
          </div>

          {/* Chart */}
          <div className="fc-chart-wrap">
            <ForecastChart historical={data.historical} forecast={data.forecast}/>
          </div>

          {/* Legend */}
          <div className="fc-legend">
            <span className="fc-leg-item">
              <span className="fc-leg-dot" style={{background:'#2563eb'}}/>
              Historical (last 12 months)
            </span>
            <span className="fc-leg-item">
              <span className="fc-leg-dash" style={{background:'#ef4444'}}/>
              LSTM Forecast ({steps} months)
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Smooth SVG Activity Chart ──────────────────────────────
function ActivityChart({ raw, xLabels }) {
  const w = 560, h = 220;
  // Fallback prevents divide-by-zero/empty rendering during edge cases.
  const safeRaw = Array.isArray(raw) && raw.length > 1 ? raw : [18, 22, 35, 50, 72, 95, 115];
  const max = Math.max(...safeRaw);
  const pad = { t: 20, r: 20, b: 40, l: 20 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;

  const pts = safeRaw.map((v, i) => ({
    x: pad.l + (i / (safeRaw.length - 1)) * cw,
    y: pad.t + ch - (v / max) * ch,
  }));

  // catmull-rom to cubic bezier
  function toCubic(pts) {
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  const linePath = toCubic(pts);
  const areaPath = linePath + ` L${pts[pts.length - 1].x},${pad.t + ch} L${pts[0].x},${pad.t + ch} Z`;

  const peakIdx = safeRaw.indexOf(max);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="activity-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i}
          x1={pad.l} y1={pad.t + ch * (1 - f)}
          x2={pad.l + cw} y2={pad.t + ch * (1 - f)}
          stroke="#e2e5ea" strokeWidth="1"
        />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)"/>
      {/* Line */}
      <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Peak dot */}
      <circle cx={pts[peakIdx].x} cy={pts[peakIdx].y} r="5" fill="#fff" stroke="#2563eb" strokeWidth="2.5"/>
      {/* X-axis labels */}
      {xLabels.map((lbl, i) => (
        <text key={lbl}
          x={pad.l + (i / (xLabels.length - 1)) * cw}
          y={h - 8}
          textAnchor="middle"
          className="chart-axis-lbl"
        >{lbl}</text>
      ))}
    </svg>
  );
}

// ── Victim Pattern Summary Widget ───────────────────────────
function VictimPatternWidget() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVictimization()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const topCrime = data?.crime_distribution
    ? Object.entries(data.crime_distribution).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  const highDistricts = data?.district_vulnerability
    ? data.district_vulnerability.filter(d => d.vulnerability === "HIGH").map(d => d.district)
    : [];

  const totalIncidents = data?.total_incidents ?? null;

  const genderRaw = data?.gender_breakdown || {};
  const genderTotal = Object.values(genderRaw).reduce((s, v) => s + v, 0) || 1;
  const GENDER_COLORS = { Male: "#2563eb", Female: "#e8102a", M: "#2563eb", F: "#e8102a" };
  const genderChips = Object.entries(genderRaw).map(([k, v]) => ({
    label: k,
    pct: Math.round((v / genderTotal) * 100),
    color: GENDER_COLORS[k] || "#a855f7",
  }));

  const medDistricts = data?.district_vulnerability
    ? data.district_vulnerability.filter(d => d.vulnerability === "MEDIUM").length
    : 0;

  const lowDistricts = data?.district_vulnerability
    ? data.district_vulnerability.filter(d => d.vulnerability === "LOW").length
    : 0;

  return (
    <div className="vpc-card">
      <div className="vpc-header">
        <div className="vpc-title-row">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e8102a" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="vpc-title">Victim Pattern Summary</span>
        </div>
        <span className="vpc-badge">KMeans AI</span>
      </div>

      {loading ? (
        <div className="vpc-loading">
          <div className="vpc-spinner" />
          <span>Analyzing patterns…</span>
        </div>
      ) : (
        <div className="vpc-body">

          {/* Top metrics row */}
          <div className="vpc-metrics">
            <div className="vpc-metric">
              <p className="vpc-metric-label">TOTAL INCIDENTS</p>
              <p className="vpc-metric-val">{totalIncidents != null ? totalIncidents.toLocaleString() : "—"}</p>
            </div>
            <div className="vpc-metric">
              <p className="vpc-metric-label">TOP CRIME TYPE</p>
              <p className="vpc-metric-val vpc-crime">{topCrime || "—"}</p>
            </div>
            <div className="vpc-metric">
              <p className="vpc-metric-label">HIGH-RISK ZONES</p>
              <p className="vpc-metric-val vpc-risk">{highDistricts.length}</p>
            </div>
            <div className="vpc-metric">
              <p className="vpc-metric-label">MED / LOW ZONES</p>
              <p className="vpc-metric-val">{medDistricts} / {lowDistricts}</p>
            </div>
          </div>

          {/* Gender breakdown */}
          {genderChips.length > 0 && (
            <div className="vpc-gender-row">
              <span className="vpc-section-label">GENDER SPLIT</span>
              <div className="vpc-gender-chips">
                {genderChips.map(g => (
                  <span key={g.label} className="vpc-gender-chip"
                    style={{ background: `${g.color}18`, color: g.color, borderColor: `${g.color}40` }}>
                    {g.label} {g.pct}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* High-risk districts */}
          {highDistricts.length > 0 && (
            <div className="vpc-districts-row">
              <span className="vpc-section-label">HIGH-RISK DISTRICTS</span>
              <div className="vpc-district-chips">
                {highDistricts.map(d => (
                  <span key={d} className="vpc-district-chip">{d}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── Stat Card Icons ────────────────────────────────────────
function StatIcon({ type }) {
  const icons = {
    users: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    shield: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/>
      </svg>
    ),
    alert: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    server: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="8" rx="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/>
        <line x1="6" y1="18" x2="6.01" y2="18"/>
      </svg>
    ),
  };
  return icons[type] || null;
}

// ── Main Component ─────────────────────────────────────────
export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Last 30 Days");
  const [statCards, setStatCards] = useState(STAT_CARDS);
  const [securityAlerts, setSecurityAlerts] = useState(SECURITY_ALERTS);
  const [activityLog, setActivityLog] = useState(ACTIVITY_LOG);
  const [statsLoading, setStatsLoading] = useState(true);

  const baseActivity30 = useMemo(
    () => [18, 22, 35, 50, 72, 95, 115, 130, 138, 132, 118, 100, 88, 80, 75, 72, 78, 85, 90, 88, 82, 70, 58, 45, 38, 30, 25, 22, 20, 18],
    []
  );

  const { activitySeries, axisLabels } = useMemo(() => {
    if (period === "Last 7 Days") {
      const s = baseActivity30.slice(-7);
      return {
        activitySeries: s,
        axisLabels: ["DAY 01", "DAY 03", "DAY 05", "DAY 07"],
      };
    }

    if (period === "Last 90 Days") {
      const older = baseActivity30.map((v, i) => Math.max(8, Math.round(v * (0.78 + (i % 4) * 0.015))));
      const mid = baseActivity30.map((v, i) => Math.max(10, Math.round(v * (0.9 + (i % 3) * 0.02))));
      const s = [...older, ...mid, ...baseActivity30];
      return {
        activitySeries: s,
        axisLabels: ["DAY 01", "DAY 23", "DAY 45", "DAY 67", "DAY 90"],
      };
    }

    return {
      activitySeries: baseActivity30,
      axisLabels: ["DAY 01", "DAY 08", "DAY 15", "DAY 22", "DAY 30"],
    };
  }, [period, baseActivity30]);

  const chartMetrics = useMemo(() => {
    const total = activitySeries.reduce((acc, v) => acc + v, 0);
    const volume = total * 245;

    const split = Math.floor(activitySeries.length / 2);
    const prev = activitySeries.slice(0, split);
    const curr = activitySeries.slice(split);
    const prevAvg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
    const currAvg = curr.length ? curr.reduce((a, b) => a + b, 0) / curr.length : 0;

    const volumeDeltaRaw = prevAvg > 0 ? ((currAvg - prevAvg) / prevAvg) * 100 : 0;
    const volumeDelta = Math.round(volumeDeltaRaw);

    const avgLoad = activitySeries.length ? total / activitySeries.length : 0;
    const responseMs = Math.max(68, Math.round(182 - avgLoad * 0.6));

    const responseChangeRaw = prevAvg > 0 ? -((currAvg - prevAvg) / prevAvg) * 100 : 0;
    const responseDelta = Math.round(responseChangeRaw);

    return {
      totalVolume: volume,
      volumeDelta,
      avgResponseMs: responseMs,
      responseDelta,
    };
  }, [activitySeries]);

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const response = await getAdminDashboardStats();
        const incomingStats = response?.data?.data?.stats;
        const incomingAlerts = response?.data?.data?.securityAlerts;
        const incomingActivity = response?.data?.data?.activityLog;

        if (Array.isArray(incomingStats) && incomingStats.length === 4) {
          setStatCards(incomingStats);
        } else {
          setStatCards(STAT_CARDS);
        }

        if (Array.isArray(incomingAlerts) && incomingAlerts.length > 0) {
          setSecurityAlerts(incomingAlerts);
        } else {
          setSecurityAlerts(SECURITY_ALERTS);
        }

        if (Array.isArray(incomingActivity) && incomingActivity.length > 0) {
          setActivityLog(incomingActivity);
        } else {
          setActivityLog(ACTIVITY_LOG);
        }
      } catch (error) {
        setStatCards(STAT_CARDS);
        setSecurityAlerts(SECURITY_ALERTS);
        setActivityLog(ACTIVITY_LOG);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="adash-page admin-with-sidebar">
      <AdminSidebar />

      {/* ── Page Header ── */}
      <div className="adash-topbar">
        <div className="adash-title-block">
          <h1 className="adash-title">Admin Dashboard</h1>
          <p className="adash-subtitle">Welcome back, system overview is up-to-date.</p>
        </div>

        <div className="adash-topbar-right">
          <div className="adash-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="adash-search"
              placeholder="Search systems…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button className="adash-notif-btn" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="notif-dot"/>
          </button>

          <div className="adash-user">
            <div className="adash-user-info">
              <p className="adash-user-name">Kasun Jayawardena</p>
              <p className="adash-user-role">SYSTEM ADMINISTRATOR</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="adash-stat-grid">
        {statCards.map((c, i) => (
          <div className="adash-stat-card" key={i} style={{"--d":`${i*0.07}s`}}>
            <div className="adash-stat-top">
              <div className={`adash-stat-icon icon-${c.icon}`}>
                <StatIcon type={c.icon}/>
              </div>
              <span className={`adash-stat-delta ${c.positive ? "pos" : "neg"}`}>{c.delta}</span>
            </div>
            <p className="adash-stat-label">{c.label}</p>
            <p className="adash-stat-value">{statsLoading ? "—" : c.value}</p>
          </div>
        ))}
      </div>

      {/* ── LSTM Forecast Widget ── */}
      <ForecastWidget />

      {/* ── Victim Pattern Summary ── */}
      <VictimPatternWidget />

      {/* ── Main Grid ── */}
      <div className="adash-main-grid">

        {/* System Activity Chart */}
        <div className="adash-chart-card">
          <div className="adash-chart-header">
            <div>
              <p className="adash-chart-title">System Activity</p>
              <p className="adash-chart-sub">Platform requests and log interactions (Last 30 Days)</p>
            </div>
            <div className="adash-chart-controls">
              <div className="period-select-wrap">
                <select className="period-select" value={period} onChange={e=>setPeriod(e.target.value)}>
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                  <option>Last 90 Days</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="period-arrow">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <button className="chart-export-btn" aria-label="Export">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="adash-chart-body">
            <ActivityChart raw={activitySeries} xLabels={axisLabels}/>
          </div>

          <div className="adash-chart-footer">
            <div className="chart-metric">
              <p className="cm-label">TOTAL VOLUME</p>
              <p className="cm-value">
                {chartMetrics.totalVolume.toLocaleString("en-US")}{" "}
                <span className={`cm-delta ${chartMetrics.volumeDelta >= 0 ? "pos" : "neg"}`}>
                  {chartMetrics.volumeDelta >= 0 ? "↑" : "↓"}{Math.abs(chartMetrics.volumeDelta)}%
                </span>
              </p>
            </div>
            <div className="chart-metric">
              <p className="cm-label">AVG RESPONSE</p>
              <p className="cm-value">
                {chartMetrics.avgResponseMs}ms{" "}
                <span className={`cm-delta ${chartMetrics.responseDelta >= 0 ? "pos" : "neg"}`}>
                  {chartMetrics.responseDelta >= 0 ? "↓" : "↑"}{Math.abs(chartMetrics.responseDelta)}%
                </span>
              </p>
            </div>
            <div className="chart-metric-right">
              <button className="view-report-btn">View Detailed Report</button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="adash-right-col">

          {/* Security Alerts */}
          <div className="adash-panel">
            <div className="adash-panel-header">
              <div className="panel-title-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/>
                </svg>
                <p className="adash-panel-title">Security Alerts</p>
              </div>
              <span className="live-badge">LIVE</span>
            </div>

            <div className="alerts-list">
              {securityAlerts.map(alert => (
                <div key={alert.id} className={`alert-item al-${alert.level}`}>
                  <div className={`alert-icon-wrap ai-${alert.level}`}>
                    {alert.level === "critical" ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    )}
                  </div>
                  <div className="alert-body">
                    <p className={`alert-tag at-${alert.level}`}>{alert.tag}</p>
                    <p className="alert-title">{alert.title}</p>
                    <p className="alert-desc">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="review-btn">Review All Security Events</button>
          </div>

          {/* Admin Activity */}
          <div className="adash-panel">
            <div className="adash-panel-header">
              <div className="panel-title-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                <p className="adash-panel-title">Admin Activity</p>
              </div>
            </div>

            <div className="activity-list">
              {activityLog.map(log => (
                <div key={log.id} className="activity-item">
                  <div className="activity-avatar" style={{background: log.avatarColor}}>
                    {log.avatar}
                  </div>
                  <div className="activity-body">
                    <p className="activity-text">
                      <strong>{log.name}</strong> {log.action}
                    </p>
                    <p className="activity-meta">{log.time} · {log.category}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="audit-link-btn">
              View Full Audit Log →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}