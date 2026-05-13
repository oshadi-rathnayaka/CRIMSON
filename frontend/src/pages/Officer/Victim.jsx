import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import "../../styles/Officer/Victim.css";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import { getVictimization } from "../../api/analytics";
import { api } from "../../lib/api";
import { formatOfficerDate } from "../../lib/officerPreferences";

const AI_INSIGHTS = [
  {
    type: "info",
    icon: "trend",
    label: "Age Correlation",
    text: "55% increase in incidents involving males aged 18–30 in Colombo District during overnight hours.",
  },
  {
    type: "warn",
    icon: "warn",
    label: "High-Risk Zone",
    text: "Galle Fort area shows an unusual spike in petty theft targeting tourists (Method: Snatch Theft).",
  },
  {
    type: "ok",
    icon: "check",
    label: "Data Integrity",
    text: "98% of new entries contain complete demographic profiles. Location data is highly accurate.",
  },
];

const SUPPORT_ALLOC = [
  { label: "Legal Aid",        pct: 45, color: "#2563eb" },
  { label: "Medical Support",  pct: 30, color: "#f97316" },
  { label: "Counseling",       pct: 15, color: "#a855f7" },
  { label: "Financial Aid",    pct: 10, color: "#22c55e" },
];

const AGE_BARS = [
  { label: "0–18",  h: 28 },
  { label: "18–25", h: 55 },
  { label: "25–34", h: 40 },
  { label: "35–44", h: 82 }, // tallest / highlighted
  { label: "45–50", h: 48 },
  { label: "50+",   h: 32 },
];

const HEATMAP = {
  rows: ["Colombo", "Galle", "Kandy"],
  cols: ["Theft", "Assault", "Imprisonment", "Fraud", "Other"],
  data: [
    ["High",     "Med",      "Low",      "Med-Hi", "Low"],
    ["Med",      "High",     "Low",      "Low",    "Low"],
    ["Low",      "Low-Med",  "Med-Hi",   "Med",    "Low"],
  ],
};

function heatColor(val) {
  const map = {
    "High":    "#e8102a",
    "Med-Hi":  "#f97316",
    "Med":     "#facc15",
    "Low-Med": "#86efac",
    "Low":     "#dcfce7",
  };
  return map[val] || "#f0f2f5";
}
function heatText(val) {
  const dark = ["High","Med-Hi"];
  return dark.includes(val) ? "#fff" : "#374151";
}

// ── Tiny SVG Gender Donut ──────────────────────────────────
function GenderDonut({ slices: propSlices, total: propTotal }) {
  const slices = propSlices && propSlices.length
    ? propSlices
    : [
        { pct: 55, color: "#2563eb", label: "Male (55%)"   },
        { pct: 35, color: "#e8102a", label: "Female (35%)" },
        { pct: 10, color: "#a855f7", label: "Other (10%)"  },
      ];
  const displayTotal = propTotal ?? "1,847";
  const r = 36, cx = 50, cy = 50, sw = 14;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="gender-donut-wrap">
      <svg viewBox="0 0 100 100" className="gender-donut-svg">
        {slices.map((s, i) => {
          const dash = (s.pct / 100) * circ;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={s.color} strokeWidth={sw}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-(offset / 100) * circ}
              transform="rotate(-90 50 50)"
            />
          );
          offset += s.pct;
          return el;
        })}
        <text x="50" y="47" textAnchor="middle" className="donut-val-sm">Total</text>
        <text x="50" y="58" textAnchor="middle" className="donut-num">{displayTotal}</text>
      </svg>
      <div className="gender-legend">
        {slices.map(s => (
          <div key={s.label} className="gl-item">
            <span className="gl-dot" style={{ background: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Age Bar Chart ──────────────────────────────────────────
function AgeBars({ bars }) {
  const barData = bars && bars.length ? bars : AGE_BARS;
  const max = Math.max(...barData.map(b => b.h));
  return (
    <div className="age-bars-wrap">
      <div className="age-bars-chart">
        {barData.map((b, i) => (
          <div key={b.label} className="age-col">
            <div className="age-bar-outer" style={{ height: 90 }}>
              <div
                className={`age-bar-fill ${b.h >= max ? "highlight" : ""}`}
                style={{ height: `${(b.h / max) * 90}px` }}
              />
            </div>
            <span className="age-tick">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function Victim() {
  const [search,  setSearch]  = useState("");
  const [district, setDistrict] = useState("All Districts");
  const [crimeType, setCrimeType] = useState("All Crime Types");
  const [supportSt, setSupportSt] = useState("Support Status");
  const fileRef = useRef();
  const [fileName, setFileName] = useState("");

  // Add Entry modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ victimName: "", victimAge: "", victimGender: "Male", crimeType: "", district: "", serviceType: "medical", serviceLabel: "", priority: "normal", description: "" });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // CSV import
  const [csvPreview, setCsvPreview] = useState(null); // [{row}, ...]
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState("");
  const [victimData, setVictimData] = useState(null);
  const [vitLoading, setVitLoading] = useState(true);
  const [supportRows, setSupportRows] = useState([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState("");

  // ── Add Entry submit ─────────────────────────────────────
  const handleAddEntry = async (e) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.victimAge || !addForm.crimeType || !addForm.district) {
      setAddError("Age, crime type and district are required.");
      return;
    }
    setAddLoading(true);
    try {
      await api.post("/support/officer-entry", {
        ...addForm,
        serviceLabel: addForm.serviceLabel || addForm.serviceType,
      });
      setShowAddModal(false);
      fetchSupportRequests();
    } catch (err) {
      setAddError(err?.response?.data?.message || "Failed to create entry.");
    } finally {
      setAddLoading(false);
    }
  };

  // ── CSV import ───────────────────────────────────────────
  const REQUIRED_COLS = ["victimAge", "victimGender", "crimeType", "district", "serviceType"];
  const handleCsvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const [headerLine, ...lines] = text.trim().split("\n");
      const headers = headerLine.split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.filter(l => l.trim()).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      });
      setCsvPreview(rows);
      setCsvResult("");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCsvImport = async () => {
    if (!csvPreview?.length) return;
    setCsvImporting(true);
    let ok = 0, fail = 0;
    for (const row of csvPreview) {
      try {
        await api.post("/support/officer-entry", {
          victimName:   row.victimName || "",
          victimAge:    row.victimAge,
          victimGender: row.victimGender || "Other",
          crimeType:    row.crimeType,
          district:     row.district,
          serviceType:  row.serviceType || "medical",
          serviceLabel: row.serviceLabel || row.serviceType || "medical",
          priority:     row.priority || "normal",
          description:  row.description || "Imported from CSV",
        });
        ok++;
      } catch { fail++; }
    }
    setCsvImporting(false);
    setCsvResult(`Imported ${ok} entries. ${fail > 0 ? `${fail} failed.` : ""}`);
    setCsvPreview(null);
    fetchSupportRequests();
  };

  const handleDeleteRequest = useCallback(async (row) => {
    const ok = window.confirm(`Delete support request ${row.id} for ${row.name}?`);
    if (!ok) return;

    try {
      await api.delete(`/support/requests/${row.raw._id}`);
      setSupportRows((prev) => prev.filter((item) => item.raw._id !== row.raw._id));
    } catch (err) {
      window.alert(err?.response?.data?.message || "Failed to delete support request.");
    }
  }, []);

  const fetchSupportRequests = useCallback(async () => {
    setSupportLoading(true);
    setSupportError("");
    try {
      const res = await api.get("/support/requests");
      const mapped = (res.data?.data || []).map((row) => ({
        id: row.ticketId,
        name: row.victimName || row.userId?.fullName || "Unknown Citizen",
        age: row.victimAge ?? "-",
        gender: row.victimGender || "Unknown",
        crime: row.crimeType || "-",
        district: row.district || row.userId?.district || "Unknown",
        date: row.createdAt
          ? formatOfficerDate(row.createdAt, { year: "numeric", month: "2-digit", day: "2-digit" })
          : "-",
        support: row.serviceLabel || row.serviceType || "Support",
        priority: row.priority === "urgent" ? "High" : "Normal",
        worker: row.status === "assigned" ? "Assigned" : "--",
        status: row.status || "submitted",
        raw: row,
      }));
      setSupportRows(mapped);
    } catch (err) {
      setSupportRows([]);
      setSupportError(err?.response?.data?.message || "Failed to load support requests.");
    } finally {
      setSupportLoading(false);
    }
  }, []);

  useEffect(() => {
    getVictimization()
      .then(res => setVictimData(res.data))
      .catch(() => setVictimData(null))
      .finally(() => setVitLoading(false));
  }, []);

  useEffect(() => {
    fetchSupportRequests();
  }, [fetchSupportRequests]);

  // ── Derived live data ──────────────────────────────────
  const liveTotal = victimData?.total_incidents != null
    ? victimData.total_incidents.toLocaleString()
    : null;

  const topCrime = victimData?.crime_distribution
    ? Object.entries(victimData.crime_distribution).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  const liveGenderSlices = victimData?.gender_breakdown
    ? (() => {
        const raw = victimData.gender_breakdown;
        const total = Object.values(raw).reduce((s, v) => s + v, 0) || 1;
        const COLORS = { Male: "#2563eb", Female: "#e8102a", M: "#2563eb", F: "#e8102a" };
        return Object.entries(raw).map(([key, count]) => ({
          pct: Math.round((count / total) * 100),
          color: COLORS[key] || "#a855f7",
          label: `${key} (${Math.round((count / total) * 100)}%)`,
        }));
      })()
    : null;

  const liveAgeBars = victimData?.age_distribution
    ? (() => {
        const raw = victimData.age_distribution;
        const entries = Object.entries(raw);
        const maxVal = Math.max(...entries.map(([, v]) => v), 1);
        return entries.map(([label, count]) => ({
          label,
          h: Math.round((count / maxVal) * 90),
        }));
      })()
    : null;

  const districtVuln = victimData?.district_vulnerability || [];

  const districtOptions = useMemo(() => [
    "All Districts",
    ...Array.from(new Set(supportRows.map((v) => v.district).filter(Boolean))).sort(),
  ], [supportRows]);

  const crimeOptions = useMemo(() => [
    "All Crime Types",
    ...Array.from(new Set(supportRows.map((v) => v.crime).filter((value) => value && value !== "-"))).sort(),
  ], [supportRows]);

  const supportOptions = useMemo(() => [
    "Support Status",
    ...Array.from(new Set(supportRows.map((v) => v.support).filter(Boolean))).sort(),
  ], [supportRows]);

  const filtered = supportRows.filter(v => {
    const q = search.toLowerCase();
    if (q && !v.name.toLowerCase().includes(q) && !v.id.includes(q)) return false;
    if (district  !== "All Districts"  && v.district !== district)  return false;
    if (crimeType !== "All Crime Types" && v.crime   !== crimeType)  return false;
    if (supportSt !== "Support Status"  && v.support !== supportSt)  return false;
    return true;
  });

  const activeSupportCases = filtered.filter((v) => ["submitted", "under_review", "assigned"].includes(v.status)).length;
  const ageValues = filtered.map((v) => Number(v.age)).filter((v) => Number.isFinite(v));
  const avgVictimAge = ageValues.length
    ? (ageValues.reduce((sum, value) => sum + value, 0) / ageValues.length).toFixed(1)
    : "-";
  const mostCommonSupport = (() => {
    const counts = filtered.reduce((acc, row) => {
      acc[row.support] = (acc[row.support] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  })();
  const genderSlices = useMemo(() => {
    const counts = filtered.reduce((acc, row) => {
      if (row.gender && row.gender !== "Unknown") {
        acc[row.gender] = (acc[row.gender] || 0) + 1;
      }
      return acc;
    }, {});

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    if (!total) return null;

    const colors = {
      Male: "#2563eb",
      Female: "#e8102a",
      Other: "#a855f7",
      "Prefer not to say": "#64748b",
    };

    return Object.entries(counts).map(([label, count]) => ({
      pct: Math.round((count / total) * 100),
      color: colors[label] || "#64748b",
      label: `${label} (${Math.round((count / total) * 100)}%)`,
    }));
  }, [filtered]);

  const ageBars = useMemo(() => {
    const buckets = [
      { label: "0–18", min: 0, max: 18, count: 0 },
      { label: "19–25", min: 19, max: 25, count: 0 },
      { label: "26–35", min: 26, max: 35, count: 0 },
      { label: "36–45", min: 36, max: 45, count: 0 },
      { label: "46–60", min: 46, max: 60, count: 0 },
      { label: "60+", min: 61, max: 200, count: 0 },
    ];

    filtered.forEach((row) => {
      const age = Number(row.age);
      if (!Number.isFinite(age)) return;
      const bucket = buckets.find((item) => age >= item.min && age <= item.max);
      if (bucket) bucket.count += 1;
    });

    const max = Math.max(...buckets.map((item) => item.count), 0);
    if (max === 0) return null;
    return buckets.map((item) => ({ label: item.label, h: item.count }));
  }, [filtered]);

  return (
    <div className="victim-page officer-with-sidebar">
      <OfficerSidebar />

      {/* ── Page Header ── */}
      <div className="victim-header">
        <div className="victim-breadcrumb">
          <span className="bc-plain">Criminal Demographic Analysis</span>
          <span className="bc-sep">›</span>
          <span className="bc-active">Victim Demographics Pattern Analyzer</span>
        </div>

        <div className="victim-title-row">
          <div>
            <h1 className="victim-title">Victim Demographics Pattern Analyzer</h1>
            <p className="victim-desc">
              Analyze victim profiles and detect emerging demographic trends in Sri Lanka using AI-driven insights.
            </p>
          </div>
          <div className="victim-actions">
            <button className="action-btn outline" onClick={() => fileRef.current.click()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import CSV
              <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleCsvFile}/>
            </button>
            <button className="action-btn primary" onClick={() => { setShowAddModal(true); setAddError(""); setAddForm({ victimName: "", victimAge: "", victimGender: "Male", crimeType: "", district: "", serviceType: "medical", serviceLabel: "", priority: "normal", description: "" }); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Pattern Detection Banner ── */}
      <div className="ai-banner">
        <div className="ai-banner-label">
          <span className="ai-dot"/>
          <span>AI PATTERN DETECTION</span>
        </div>
        <div className="ai-insights">
          {AI_INSIGHTS.map((ins, i) => (
            <div key={i} className={`ai-card ai-${ins.type}`}>
              <div className={`ai-icon ai-icon-${ins.type}`}>
                {ins.type === "info" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                  </svg>
                )}
                {ins.type === "warn" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                )}
                {ins.type === "ok" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <div className="ai-card-body">
                <strong>{ins.label}</strong>
                <p>{ins.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="victim-stats">
        {[
          { label: "Total Victims",        value: String(filtered.length), sub: `${supportRows.length} total requests`,  subColor: "red",   trend: true  },
          { label: "Active Support Cases", value: String(activeSupportCases), sub: "Submitted / reviewing / assigned", subColor: "green", trend: true  },
          { label: "Most Common Support",  value: mostCommonSupport, sub: "Based on visible table", subColor: "grey" },
          { label: "Avg Victim Age",       value: avgVictimAge, sub: ageValues.length ? "Calculated from visible table" : "No age data", subColor: "red", trend: true },
        ].map((c, i) => (
          <div className="vstat-card" key={i} style={{"--d":`${i*0.06}s`}}>
            <p className="vstat-label">{c.label}</p>
            <p className="vstat-value">{c.value}</p>
            <p className={`vstat-sub ${c.subColor}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div className="victim-filters">
        <div className="search-wrap">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search victims, IDs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {[
          [district,   setDistrict,   districtOptions],
          [crimeType,  setCrimeType,  crimeOptions],
          [supportSt,  setSupportSt,  supportOptions],
        ].map(([val, setter, opts], i) => (
          <div className="filter-sel-wrap" key={i}>
            <select className="filter-sel" value={val} onChange={e => setter(e.target.value)}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
            <span className="fsel-arrow">▾</span>
          </div>
        ))}
        <div className="filter-actions">
          <button className="filt-apply">Apply</button>
          <button className="filt-reset" onClick={() => { setSearch(""); setDistrict("All Districts"); setCrimeType("All Crime Types"); setSupportSt("Support Status"); }}>Reset</button>
        </div>
      </div>

      {/* ── Victim Table ── */}
      <div className="vtable-wrap">
        {supportError && <div className="vtable-error">{supportError}</div>}
        <table className="vtable">
          <thead>
            <tr>
              {["Ticket ID","Victim Name","Age","Gen","Crime Type","District","Date","Support Type","Priority","Case Worker","Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {supportLoading ? (
              <tr><td colSpan={11} className="vtable-empty">Loading support requests...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11} className="vtable-empty">No support requests found.</td></tr>
            ) : filtered.map((v, i) => (
              <tr key={v.id} style={{"--ri":`${i*0.05}s`}}>
                <td className="vtd-id">{v.id}</td>
                <td className="vtd-name">{v.name}</td>
                <td>{v.age}</td>
                <td>
                  <span className={`gpill ${v.gender === "Male" ? "g-male" : v.gender === "Female" ? "g-female" : "g-unknown"}`}>
                    {v.gender === "Male" ? "M" : v.gender === "Female" ? "F" : v.gender}
                  </span>
                </td>
                <td>{v.crime}</td>
                <td>{v.district}</td>
                <td className="vtd-date">{v.date}</td>
                <td>
                  <span className={`spill sp-${v.support.toLowerCase()}`}>{v.support}</span>
                </td>
                <td>
                  <span className={`ppill pp-${v.priority.toLowerCase()}`}>{v.priority}</span>
                </td>
                <td>
                  <div className="worker-avatar">{v.worker}</div>
                </td>
                <td>
                  <button className="vdelete-btn" onClick={() => handleDeleteRequest(v)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                    <span>Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="vtable-footer">
          <span>Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {supportRows.length} entries</span>
          <div className="vtable-nav">
            <button className="vnav-btn">Previous</button>
            <button className="vnav-btn">Next</button>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="charts-3col">

        {/* Gender Distribution */}
        <div className="vchart-card">
          <p className="vchart-title">Victim Gender Distribution</p>
          <GenderDonut slices={genderSlices || liveGenderSlices} total={filtered.length || liveTotal} />
        </div>

        {/* Age Demographics */}
        <div className="vchart-card">
          <p className="vchart-title">Age Demographics</p>
          <AgeBars bars={ageBars || liveAgeBars} />
        </div>

        {/* Support Allocation */}
        <div className="vchart-card">
          <p className="vchart-title">Support Services Allocation</p>
          <div className="support-alloc">
            {SUPPORT_ALLOC.map(s => (
              <div key={s.label} className="alloc-row">
                <div className="alloc-label-row">
                  <span className="alloc-label">{s.label}</span>
                  <span className="alloc-pct">{s.pct}%</span>
                </div>
                <div className="alloc-track">
                  <div className="alloc-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── District Vulnerability Index ── */}
      <div className="heatmap-card">
        <div className="heatmap-header">
          <p className="vchart-title">District Vulnerability Index</p>
          <span className="hm-ai-badge">KMeans AI</span>
        </div>
        {vitLoading ? (
          <div className="hm-loading-state">Analyzing district vulnerability data…</div>
        ) : (
          <div className="hm-district-grid">
            {districtVuln.length > 0
              ? districtVuln.map(({ district: d, vulnerability }) => (
                  <div key={d} className="hm-district-row">
                    <span className="hm-district-name">{d}</span>
                    <span className={`hm-vuln-badge vb-${vulnerability.toLowerCase()}`}>{vulnerability}</span>
                  </div>
                ))
              : <p className="hm-no-data">No vulnerability data available.</p>
            }
          </div>
        )}
      </div>
      {/* ── Heatmap ── end */}

      {/* ── Add Entry Modal ── */}
      {showAddModal && (
        <div className="victim-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="victim-modal" onClick={e => e.stopPropagation()}>
            <div className="vmodal-header">
              <h3>Add Victim Entry</h3>
              <button className="vmodal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form className="vmodal-form" onSubmit={handleAddEntry}>
              <div className="vmodal-row">
                <label>Victim Name</label>
                <input value={addForm.victimName} onChange={e => setAddForm(f => ({...f, victimName: e.target.value}))} placeholder="Full name (optional)" />
              </div>
              <div className="vmodal-row">
                <label>Age *</label>
                <input type="number" min="0" max="120" value={addForm.victimAge} onChange={e => setAddForm(f => ({...f, victimAge: e.target.value}))} placeholder="e.g. 34" required />
              </div>
              <div className="vmodal-row">
                <label>Gender *</label>
                <select value={addForm.victimGender} onChange={e => setAddForm(f => ({...f, victimGender: e.target.value}))}>
                  <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                </select>
              </div>
              <div className="vmodal-row">
                <label>Crime Type *</label>
                <input value={addForm.crimeType} onChange={e => setAddForm(f => ({...f, crimeType: e.target.value}))} placeholder="e.g. Theft, Assault" required />
              </div>
              <div className="vmodal-row">
                <label>District *</label>
                <input value={addForm.district} onChange={e => setAddForm(f => ({...f, district: e.target.value}))} placeholder="e.g. Colombo" required />
              </div>
              <div className="vmodal-row">
                <label>Support Service *</label>
                <select value={addForm.serviceType} onChange={e => setAddForm(f => ({...f, serviceType: e.target.value, serviceLabel: e.target.value}))}>
                  <option value="medical">Medical</option>
                  <option value="legal">Legal</option>
                  <option value="counseling">Counseling</option>
                  <option value="welfare">Welfare</option>
                </select>
              </div>
              <div className="vmodal-row">
                <label>Priority</label>
                <select value={addForm.priority} onChange={e => setAddForm(f => ({...f, priority: e.target.value}))}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="vmodal-row">
                <label>Notes</label>
                <textarea value={addForm.description} onChange={e => setAddForm(f => ({...f, description: e.target.value}))} placeholder="Additional notes…" rows={3} />
              </div>
              {addError && <p className="vmodal-error">{addError}</p>}
              <div className="vmodal-footer">
                <button type="button" className="action-btn outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="action-btn primary" disabled={addLoading}>
                  {addLoading ? "Saving…" : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CSV Preview Modal ── */}
      {csvPreview && (
        <div className="victim-modal-overlay" onClick={() => { setCsvPreview(null); setCsvResult(""); }}>
          <div className="victim-modal vmodal-wide" onClick={e => e.stopPropagation()}>
            <div className="vmodal-header">
              <h3>CSV Preview — {csvPreview.length} rows</h3>
              <button className="vmodal-close" onClick={() => { setCsvPreview(null); setCsvResult(""); }}>✕</button>
            </div>
            <p className="vmodal-hint">Required columns: victimAge, victimGender, crimeType, district, serviceType</p>
            <div className="vmodal-csv-scroll">
              <table className="vmodal-csv-table">
                <thead><tr>{Object.keys(csvPreview[0] || {}).map(col => <th key={col}>{col}</th>)}</tr></thead>
                <tbody>
                  {csvPreview.slice(0, 10).map((row, i) => (
                    <tr key={i}>{Object.values(row).map((val, j) => <td key={j}>{val}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              {csvPreview.length > 10 && <p className="vmodal-hint">…and {csvPreview.length - 10} more rows</p>}
            </div>
            {csvResult && <p className="vmodal-success">{csvResult}</p>}
            <div className="vmodal-footer">
              <button type="button" className="action-btn outline" onClick={() => { setCsvPreview(null); setCsvResult(""); }}>Cancel</button>
              <button type="button" className="action-btn primary" disabled={csvImporting} onClick={handleCsvImport}>
                {csvImporting ? "Importing…" : `Import ${csvPreview.length} rows`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}