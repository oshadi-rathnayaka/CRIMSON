import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import "../../styles/Officer/Criminal.css";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import { getRecidivism } from "../../api/analytics";
import { api } from "../../lib/api";
import { formatOfficerDate } from "../../lib/officerPreferences";

const DISTRICTS = ["All Districts","Colombo","Gampaha","Kandy","Galle","Jaffna","Kurunegala"];
const CRIME_TYPES = ["All Crimes","Larceny","Robbery","Drug Possession","Vandalism","Fraud","Assault"];
const STATUSES = ["Any Status","Active","On Bail","Imprisoned","Released"];

// Map UI crime labels to dataset crime_type values
const CRIME_MAP = {
  "Aggravated Robbery": "Robbery",
  "Larceny":            "Property Theft",
  "Drug Possession":    "Drug Offences (Heroin)",
  "Vandalism":          "Property Theft",
  "Financial Fraud":    "Cheating/BCT",
};
const toAgeGroup = (age) => {
  if (age <= 17) return "0-17";
  if (age <= 25) return "18-25";
  if (age <= 35) return "26-35";
  if (age <= 45) return "36-45";
  if (age <= 60) return "46-60";
  return "60+";
};

// ── Tiny inline chart components ──────────────────────────
function CrimeDonut() {
  // simplified donut arcs
  const slices = [
    { pct: 35, color: "#e8102a" },
    { pct: 28, color: "#f97316" },
    { pct: 20, color: "#facc15" },
    { pct: 17, color: "#64748b" },
  ];
  let offset = 0;
  const r = 38, cx = 50, cy = 50, stroke = 14;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="mini-donut">
      {slices.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const gap  = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ / 100}
            transform="rotate(-90 50 50)"
          />
        );
        offset += s.pct;
        return el;
      })}
      <text x="50" y="47" textAnchor="middle" className="donut-val">1.2k</text>
      <text x="50" y="59" textAnchor="middle" className="donut-sub">total</text>
    </svg>
  );
}

function TrendLine() {
  const pts = [10,28,18,35,25,45,38,60,50,75,65,88];
  const w=120, h=60;
  const xs = pts.map((_,i) => (i/(pts.length-1))*w);
  const ys = pts.map(p => h - (p/100)*h);
  const d  = xs.map((x,i) => `${i===0?"M":"L"}${x},${ys[i]}`).join(" ");
  const area = d + ` L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mini-line" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendGrad)"/>
      <path d={d} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function HeatMapBlob() {
  return (
    <svg viewBox="0 0 100 100" className="mini-heat">
      <rect width="100" height="100" fill="#e8e8e8" rx="4"/>
      <ellipse cx="55" cy="45" rx="28" ry="22" fill="#e8102a" opacity="0.5"/>
      <ellipse cx="55" cy="45" rx="14" ry="11" fill="#e8102a" opacity="0.6"/>
      <ellipse cx="55" cy="45" rx="5"  ry="4"  fill="#e8102a" opacity="0.9"/>
      <text x="50" y="92" textAnchor="middle" fontSize="7" fill="#555">Colombo District</text>
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function Criminal() {
  const [offenders, setOffenders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState("");
  const [district, setDistrict]   = useState("All Districts");
  const [crimeType, setCrimeType] = useState("All Crimes");
  const [status, setStatus]       = useState("Any Status");
  const [dateRange, setDateRange] = useState("");
  const [dragOver, setDragOver]   = useState(false);
  const [fileName, setFileName]   = useState("");
  const [riskData, setRiskData]   = useState({});
  const [riskLoading, setRiskLoading] = useState(true);
  const [csvPreview, setCsvPreview]   = useState(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult]     = useState("");
  const fileRef = useRef();

  const loadOffenders = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/offenders");
      const mapped = (res.data?.data || []).map((row) => ({
        _id: row._id,
        id: row.nic,
        name: row.fullName,
        age: row.age,
        gender: row.gender || "Unknown",
        crime: row.primaryCrimeType || "Unknown",
        district: row.district || "Unknown",
        offenses: Number(row.convictionCount || 0) + Number(row.pendingCaseCount || 0),
        status: row.legalStatus || "Open",
        risk: String(row.riskLevel || "Medium").toUpperCase(),
        last: row.updatedAt
          ? formatOfficerDate(row.updatedAt, { year: "numeric", month: "2-digit", day: "2-digit" })
          : "-",
      }));
      setOffenders(mapped);
    } catch (err) {
      setOffenders([]);
      setLoadError(err?.response?.data?.message || "Failed to load offender records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffenders();
  }, [loadOffenders]);

  useEffect(() => {
    if (offenders.length === 0) {
      setRiskData({});
      setRiskLoading(false);
      return;
    }

    setRiskLoading(true);
    Promise.all(
      offenders.map(o =>
        getRecidivism({
          crime_type:            CRIME_MAP[o.crime] || o.crime,
          district:              o.district,
          victim_gender:         o.gender === "Unknown" ? "Male" : o.gender,
          time_bracket:          "Night",
          location_type:         "Residential",
          lighting_level:        "Dark",
          offender_drug_history: o.offenses > 3 ? "Yes" : "No",
          is_holiday:            0,
          cleared_rate_pct:      50.0,
          victim_age_bracket:    toAgeGroup(o.age),
          year:                  2024,
        })
          .then(r => ({ id: o.id, data: r.data }))
          .catch(() => ({ id: o.id, data: null }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { map[r.id] = r.data; });
      setRiskData(map);
    }).finally(() => setRiskLoading(false));
  }, [offenders]);

  const handleFile = (f) => {
    if (!f) return;
    setFileName(f.name);
    setCsvResult("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
        return obj;
      }).filter(r => r.nic && r.fullname);
      setCsvPreview(rows);
    };
    reader.readAsText(f);
  };

  const handleCsvImport = async () => {
    if (!csvPreview || csvPreview.length === 0) return;
    setCsvImporting(true);
    let ok = 0, fail = 0, dup = 0;
    for (const row of csvPreview) {
      try {
        await api.post("/offenders", {
          nic:              row.nic,
          fullName:         row.fullname || row.fullName,
          age:              row.age ? Number(row.age) : undefined,
          gender:           row.gender || undefined,
          alias:            row.alias || "",
          district:         row.district || "Unknown",
          primaryCrimeType: row.primarycrimetype || row.primaryCrimeType || row.crime || "Unknown",
          riskLevel:        row.risklevel || row.riskLevel || "Medium",
          legalStatus:      row.legalstatus || row.legalStatus || "Open",
          convictionCount:  row.convictioncount ? Number(row.convictioncount) : 0,
          pendingCaseCount: row.pendingcasecount ? Number(row.pendingcasecount) : 0,
          notes:            row.notes || "",
        });
        ok++;
      } catch (err) {
        if (err?.response?.status === 409) dup++; else fail++;
      }
    }
    setCsvImporting(false);
    setCsvPreview(null);
    setFileName("");
    setCsvResult(`Imported ${ok} records.${dup > 0 ? ` ${dup} duplicate(s) skipped.` : ""}${fail > 0 ? ` ${fail} failed.` : ""}`);
    loadOffenders();
  };

  const districtOptions = useMemo(() => [
    "All Districts",
    ...Array.from(new Set(offenders.map((o) => o.district).filter(Boolean))).sort(),
  ], [offenders]);

  const crimeOptions = useMemo(() => [
    "All Crimes",
    ...Array.from(new Set(offenders.map((o) => o.crime).filter(Boolean))).sort(),
  ], [offenders]);

  const statusOptions = useMemo(() => [
    "Any Status",
    ...Array.from(new Set(offenders.map((o) => o.status).filter(Boolean))).sort(),
  ], [offenders]);

  const filtered = offenders.filter(o => {
    if (district !== "All Districts" && o.district !== district) return false;
    if (crimeType !== "All Crimes"   && o.crime !== crimeType)   return false;
    if (status !== "Any Status"      && o.status !== status)     return false;
    return true;
  });

  const totalCases = filtered.length;
  const ageSum = filtered.reduce((sum, o) => sum + (Number(o.age) || 0), 0);
  const avgAge = totalCases ? (ageSum / totalCases) : 0;
  const repeatCount = filtered.filter((o) => (Number(o.offenses) || 0) > 1).length;
  const repeatPct = totalCases ? Math.round((repeatCount / totalCases) * 100) : 0;

  const crimeCountMap = filtered.reduce((acc, o) => {
    const key = o.crime || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const sortedCrimes = Object.entries(crimeCountMap).sort((a, b) => b[1] - a[1]);
  const commonCrime = sortedCrimes.length ? sortedCrimes[0][0] : "-";
  const commonCrimePct = totalCases && sortedCrimes.length
    ? Math.round((sortedCrimes[0][1] / totalCases) * 100)
    : 0;

  const statCards = [
    {
      label: "TOTAL CASES",
      value: String(totalCases),
      sub: `${totalCases} in current table`,
      subColor: "green",
    },
    {
      label: "COMMON CRIME",
      value: commonCrime,
      sub: `${commonCrimePct}% of filtered records`,
      subColor: "grey",
    },
    {
      label: "AVG OFFENDER AGE",
      value: totalCases ? `${avgAge.toFixed(1)} yrs` : "-",
      sub: "Calculated from visible table",
      subColor: "red",
    },
    {
      label: "REPEAT OFFENDERS",
      value: `${repeatPct}%`,
      sub: `${repeatCount} with 2+ offenses`,
      subColor: "green",
    },
  ];

  return (
    <div className="demo-page officer-with-sidebar">
      <OfficerSidebar />
      {/* ── Breadcrumb + Title ── */}
      <div className="demo-header">
        <div className="breadcrumb">
          <span className="bc-link">Criminal Demographic Analysis</span>
          <span className="bc-sep">›</span>
          <span className="bc-current">Victim/Demographics Pattern Analyzer</span>
        </div>

        <div className="page-title-row">
          <div>
            <h1 className="page-title">Criminal Demographic Analysis</h1>
            <p className="page-desc">
              Visualize and analyze demographic trends from uploaded criminal records to identify
              patterns and predict future hotspots.
            </p>
          </div>
          <span className="last-updated">Last updated: Today, 10:42 AM ●</span>
        </div>
      </div>

      {/* ── Upload Banner ── */}
      <div
        className={`upload-banner ${dragOver ? "drag-over" : ""}`}
        onClick={() => fileRef.current.click()}
        style={{cursor:"pointer"}}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
      >
        <div className="upload-left">
          <div>
            <p className="upload-title">Import Data Source</p>
            <p className="upload-sub">Upload your latest .CSV demographic dataset to update the visualization dashboard.</p>
          </div>
        </div>
        <div className="upload-right">
          <button className="upload-btn" onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            {fileName ? fileName : "+ Upload File"}
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>{handleFile(e.target.files[0]); e.target.value="";}} />
          {csvResult && <p className="upload-hint" style={{color: csvResult.includes("failed") ? "#dc2626" : "#16a34a"}}>{csvResult}</p>}
          {!csvResult && <p className="upload-hint">Supported: .csv · Required cols: nic, fullName, district, primaryCrimeType</p>}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-grid">
        {statCards.map((c, i) => (
          <div className="stat-card" key={i} style={{"--delay": `${i * 0.07}s`}}>
            <p className="stat-label">{c.label}</p>
            <p className="stat-value">{c.value}</p>
            <p className={`stat-sub ${c.subColor}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">DISTRICT</label>
          <div className="select-wrap">
            <select className="filter-select" value={district} onChange={e=>setDistrict(e.target.value)}>
              {districtOptions.map(d=><option key={d}>{d}</option>)}
            </select>
            <span className="sel-arrow">▾</span>
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">CRIME TYPE</label>
          <div className="select-wrap">
            <select className="filter-select" value={crimeType} onChange={e=>setCrimeType(e.target.value)}>
              {crimeOptions.map(c=><option key={c}>{c}</option>)}
            </select>
            <span className="sel-arrow">▾</span>
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">STATUS</label>
          <div className="select-wrap">
            <select className="filter-select" value={status} onChange={e=>setStatus(e.target.value)}>
              {statusOptions.map(s=><option key={s}>{s}</option>)}
            </select>
            <span className="sel-arrow">▾</span>
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">DATE RANGE</label>
          <input type="date" className="filter-date" value={dateRange} onChange={e=>setDateRange(e.target.value)} placeholder="mm/dd/yyyy"/>
        </div>
        <button className="apply-btn">Apply Filters</button>
      </div>

      {/* ── Data Table ── */}
      <div className="table-wrap">
        {loadError && <p className="table-count" style={{ padding: "14px 18px 0", color: "#dc2626" }}>{loadError}</p>}
        <table className="data-table">
          <thead>
            <tr>
              {["ID","OFFENDER NAME","AGE","GENDER","PRIMARY CRIME","DISTRICT","OFFENSES","STATUS","RISK LEVEL","LAST OFFENSE"].map(h=>(
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="td-center">Loading offender records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="td-center">No offender records found.</td></tr>
            ) : filtered.map((o, i) => (
              <tr key={o.id} style={{"--row-delay":`${i*0.05}s`}}>
                <td className="td-id">{o.id}</td>
                <td className="td-name">{o.name}</td>
                <td>{o.age ?? "-"}</td>
                <td>
                  <span className={`gender-pill ${o.gender.toLowerCase()}`}>{o.gender}</span>
                </td>
                <td>{o.crime}</td>
                <td>{o.district}</td>
                <td className="td-center">{o.offenses}</td>
                <td>
                  <span className={`status-pill s-${o.status.toLowerCase().replace(/\s/g,"-")}`}>{o.status}</span>
                </td>
                <td>
                  {riskLoading ? (
                    <span className="risk-pill r-loading">…</span>
                  ) : riskData[o.id] ? (
                    <span className={`risk-pill r-${riskData[o.id].risk_level.toLowerCase()}`}>
                      {riskData[o.id].risk_level}
                      <span className="risk-pct">{Math.round(riskData[o.id].probability * 100)}%</span>
                    </span>
                  ) : (
                    <span className={`risk-pill r-${o.risk.toLowerCase()}`}>{o.risk}</span>
                  )}
                </td>
                <td className="td-date">{o.last}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-footer">
          <span className="table-count">Showing {filtered.length === 0 ? 0 : 1}–{filtered.length} of {offenders.length} entries</span>
          <div className="pagination">
            <button className="pg-btn">Previous</button>
            {[1,2,3,"…",24].map((p,i)=>(
              <button key={i} className={`pg-btn ${p===1?"active":""}`}>{p}</button>
            ))}
            <button className="pg-btn">Next</button>
          </div>
        </div>
      </div>

      {/* ── CSV Preview Modal ── */}
      {csvPreview && (
        <div className="victim-modal-overlay" onClick={() => setCsvPreview(null)}>
          <div className="victim-modal vmodal-wide" onClick={e => e.stopPropagation()}>
            <div className="vmodal-header">
              <span>CSV Preview — {csvPreview.length} row{csvPreview.length !== 1 ? "s" : ""}</span>
              <button className="vmodal-close" onClick={() => setCsvPreview(null)}>✕</button>
            </div>
            <p className="vmodal-hint">Required columns: nic, fullName, district, primaryCrimeType</p>
            <div className="vmodal-csv-scroll">
              <table className="vmodal-csv-table">
                <thead>
                  <tr>
                    {["NIC","Full Name","Age","District","Crime Type","Risk","Status"].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((r, i) => (
                    <tr key={i}>
                      <td>{r.nic}</td>
                      <td>{r.fullname || r.fullName}</td>
                      <td>{r.age || "-"}</td>
                      <td>{r.district || "-"}</td>
                      <td>{r.primarycrimetype || r.primaryCrimeType || r.crime || "-"}</td>
                      <td>{r.risklevel || r.riskLevel || "Medium"}</td>
                      <td>{r.legalstatus || r.legalStatus || "Open"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="vmodal-footer">
              <button className="vmodal-cancel" onClick={() => setCsvPreview(null)}>Cancel</button>
              <button className="vmodal-save" onClick={handleCsvImport} disabled={csvImporting}>
                {csvImporting ? "Importing…" : `Import ${csvPreview.length} row${csvPreview.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Crime Distribution</span>
            <span className="chart-badge">Monthly</span>
          </div>
          <CrimeDonut/>
          <div className="donut-legend">
            {[["#e8102a","Theft"],["#f97316","Robbery"],["#facc15","Drug"],["#64748b","Other"]].map(([c,l])=>(
              <div key={l} className="legend-item">
                <span className="legend-dot" style={{background:c}}/>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Age vs Gender</span>
            <span className="chart-badge">Weekly</span>
          </div>
          <div className="age-gender-bars">
            {[["18–24",65,35],["25–34",72,28],["35–44",58,42],["45+",80,20]].map(([g,m,f])=>(
              <div key={g} className="age-row">
                <span className="age-label">{g}</span>
                <div className="age-bar-track">
                  <div className="age-bar male"  style={{width:`${m*0.6}%`}}/>
                  <div className="age-bar female" style={{width:`${f*0.6}%`}}/>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend-row">
            <span className="legend-dot" style={{background:"#2563eb"}}/><span>Male</span>
            <span className="legend-dot" style={{background:"#e8102a",marginLeft:12}}/><span>Female</span>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Repeat Offender Trends</span>
            <div className="chart-badge-red">▲ 12% <span>YoY</span></div>
          </div>
          <TrendLine/>
          <p className="chart-sub-note">Upward trend across all districts</p>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Hotspot Map</span>
            <span className="chart-badge">Province</span>
          </div>
          <HeatMapBlob/>
        </div>
      </div>
    </div>
  );
}