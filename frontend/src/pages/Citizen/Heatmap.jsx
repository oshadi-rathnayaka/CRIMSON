import React, { useState, useRef, useEffect, useCallback } from "react";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import {
  AlertTriangle, Filter, RefreshCw, ShieldCheck,
  Activity, TrendingUp, TrendingDown,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/Citizen/Heatmap.css";
import { getHotspots, getRecentAlerts } from "../../api/analytics";

/* ─────────────────────────────────────────────────────────────────
   All 25 Sri Lanka districts — real coordinates + crime stats
───────────────────────────────────────────────────────────────── */
const ALL_DISTRICTS = {
  colombo:      { name: "Colombo",      level: 4, crimes: 1245, lat: 6.9271,  lng: 79.8612, province: "Western",       trend: +12 },
  gampaha:      { name: "Gampaha",      level: 3, crimes: 782,  lat: 7.1600,  lng: 80.0150, province: "Western",       trend: +5  },
  kalutara:     { name: "Kalutara",     level: 2, crimes: 385,  lat: 6.5854,  lng: 79.9607, province: "Western",       trend: -2  },
  kandy:        { name: "Kandy",        level: 3, crimes: 521,  lat: 7.2906,  lng: 80.6337, province: "Central",       trend: +8  },
  matale:       { name: "Matale",       level: 2, crimes: 298,  lat: 7.4675,  lng: 80.6234, province: "Central",       trend: -3  },
  nuwara_eliya: { name: "Nuwara Eliya", level: 1, crimes: 124,  lat: 6.9497,  lng: 80.7891, province: "Central",       trend: -7  },
  galle:        { name: "Galle",        level: 2, crimes: 365,  lat: 6.0535,  lng: 80.2210, province: "Southern",      trend: +1  },
  matara:       { name: "Matara",       level: 2, crimes: 342,  lat: 5.9496,  lng: 80.5353, province: "Southern",      trend: -4  },
  hambantota:   { name: "Hambantota",   level: 1, crimes: 187,  lat: 6.1241,  lng: 81.1185, province: "Southern",      trend: -9  },
  jaffna:       { name: "Jaffna",       level: 2, crimes: 412,  lat: 9.6615,  lng: 80.0255, province: "Northern",      trend: +3  },
  kilinochchi:  { name: "Kilinochchi",  level: 1, crimes: 92,   lat: 9.3803,  lng: 80.3770, province: "Northern",      trend: -5  },
  mannar:       { name: "Mannar",       level: 1, crimes: 68,   lat: 8.9761,  lng: 79.9045, province: "Northern",      trend: -8  },
  vavuniya:     { name: "Vavuniya",     level: 2, crimes: 156,  lat: 8.7514,  lng: 80.4971, province: "Northern",      trend: -2  },
  mullaitivu:   { name: "Mullaitivu",   level: 1, crimes: 103,  lat: 9.2671,  lng: 80.8128, province: "Northern",      trend: -6  },
  batticaloa:   { name: "Batticaloa",   level: 2, crimes: 289,  lat: 7.7102,  lng: 81.6924, province: "Eastern",       trend: +2  },
  ampara:       { name: "Ampara",       level: 2, crimes: 267,  lat: 7.2912,  lng: 81.6724, province: "Eastern",       trend: -1  },
  trincomalee:  { name: "Trincomalee",  level: 2, crimes: 234,  lat: 8.5922,  lng: 81.1152, province: "Eastern",       trend: +4  },
  kurunegala:   { name: "Kurunegala",   level: 2, crimes: 445,  lat: 7.4818,  lng: 80.3609, province: "North Western", trend: +6  },
  puttalam:     { name: "Puttalam",     level: 1, crimes: 178,  lat: 8.0362,  lng: 79.8283, province: "North Western", trend: -3  },
  anuradhapura: { name: "Anuradhapura", level: 1, crimes: 312,  lat: 8.3114,  lng: 80.4037, province: "North Central", trend: -5  },
  polonnaruwa:  { name: "Polonnaruwa",  level: 1, crimes: 145,  lat: 7.9403,  lng: 81.0188, province: "North Central", trend: -4  },
  badulla:      { name: "Badulla",      level: 2, crimes: 298,  lat: 6.9934,  lng: 81.0550, province: "Uva",           trend: 0   },
  monaragala:   { name: "Monaragala",   level: 1, crimes: 121,  lat: 6.8728,  lng: 81.3507, province: "Uva",           trend: -6  },
  ratnapura:    { name: "Ratnapura",    level: 2, crimes: 267,  lat: 6.6828,  lng: 80.3992, province: "Sabaragamuwa",  trend: +1  },
  kegalle:      { name: "Kegalle",      level: 2, crimes: 234,  lat: 7.2513,  lng: 80.3464, province: "Sabaragamuwa",  trend: -2  },
};

const LEVEL_COLORS = { 1: "#22c55e", 2: "#eab308", 3: "#f97316", 4: "#ef4444" };
const LEVEL_LABELS = { 1: "Safe",    2: "Moderate", 3: "High Risk", 4: "Critical" };
const LEVEL_BG     = { 1: "#f0fdf4", 2: "#fefce8",  3: "#fff7ed",   4: "#fef2f2"  };
const LEVEL_TEXT   = { 1: "#16a34a", 2: "#a16207",  3: "#c2410c",   4: "#dc2626"  };

/* ───────────────────────────────────────────────────────────────────
   UI label  →  actual crime_type strings in the dataset
   ─────────────────────────────────────────────────────────────────── */
const CRIME_TYPE_MAP = {
  "Theft":        ["Property Theft", "Cattle Theft", "Crop Theft (Paddy)"],
  "Assault":      ["Grievous Hurt", "Grievous Hurt (Protest related)"],
  "Robbery":      ["Robbery"],
  "Fraud":        ["Cheating/BCT", "Financial Fraud (Pyramid Scheme)"],
  "Drug-related": ["Drug Offences (Heroin)", "Drug Offences (Cannabis)",
                   "Drug Offences (Ice/Meth)", "Drug Offences (Synthetic)"],
  "Harassment":   ["Statutory Rape", "Extortion", "Homicide"],
};

const TIME_PERIOD_DAYS = { "7 Days": 7, "30 Days": 30, "6 Mo": 180, "1 Year": 365 };

// Module-level list used by both the map legend and the parent component
const districtList = Object.values(ALL_DISTRICTS);

const formatTimeAgo = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Just now";
  const sec = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 60) return `${sec} sec ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? "s" : ""} ago`;
};

/* ─────────────────────────────────────────────────────────────────
   Leaflet Map Component
───────────────────────────────────────────────────────────────── */
const RISK_COLORS = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e" };

// Accept districtSummary to update circle colors/sizes reactively
const SriLankaHeatmap = ({ districtFilter, levelFilter, heatPoints = [], districtSummary = [], hasApiResponse = false }) => {
  const mapDivRef    = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});
  const heatLayerRef = useRef([]);
  // Build a lookup: district name → {count, level} from API
  const summaryMap = Object.fromEntries(
    districtSummary.map(d => [d.district || d.name, d])
  );

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: [7.8731, 80.7718],
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });

    // ── Create a low-z pane for DBSCAN dots (below district circles)
    const dbscanPane = map.createPane('dbscanPane');
    dbscanPane.style.zIndex = 350; // default overlay pane is 400

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 13,
      minZoom: 6,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    Object.entries(ALL_DISTRICTS).forEach(([key, d]) => {
      const radius = Math.min(10 + Math.sqrt(d.crimes) * 0.62, 26);
      const color  = LEVEL_COLORS[d.level];

      const circle = L.circleMarker([d.lat, d.lng], {
        radius,
        fillColor:   color,
        color:       "#ffffff",
        weight:      2.5,
        fillOpacity: 0.82,
      });

      const trendHtml = d.trend === 0
        ? `<span style="color:#6b7280">→ No change</span>`
        : d.trend > 0
        ? `<span style="color:#dc2626">↑ +${d.trend}% vs last month</span>`
        : `<span style="color:#16a34a">↓ ${d.trend}% vs last month</span>`;

      circle.bindTooltip(`
        <div class="hm-tip">
          <div class="hm-tip__name">${d.name}</div>
          <div class="hm-tip__province">${d.province} Province</div>
          <div class="hm-tip__badge-row">
            <span class="hm-tip__badge" style="background:${color}">${LEVEL_LABELS[d.level].toUpperCase()}</span>
          </div>
          <div class="hm-tip__crimes"><strong>${d.crimes.toLocaleString()}</strong> incidents this month</div>
          <div class="hm-tip__trend">${trendHtml}</div>
        </div>
      `, {
        sticky:    false,
        direction: "top",
        className: "hm-tooltip-wrap",
        offset:    [0, -4],
        opacity:   1,
      });

      circle.addTo(map);
      markersRef.current[key] = { circle, data: d };
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current       = null;
      markersRef.current   = {};
      heatLayerRef.current = [];
    };
  }, []);

  // ── Update district circle colors + sizes from API district_summary ──
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([key, { circle, data }]) => {
      const api = summaryMap[data.name];
      const level  = api ? api.level  : data.level;
      const crimes = api ? api.count  : data.crimes;
      const color  = LEVEL_COLORS[level];
      const radius = api
        ? Math.min(8 + Math.sqrt(crimes) * 0.9, 28)
        : Math.min(10 + Math.sqrt(crimes) * 0.62, 26);
      circle.setStyle({ fillColor: color, radius });
      // update tooltip badge color
      circle.setTooltipContent(`
        <div class="hm-tip">
          <div class="hm-tip__name">${data.name}</div>
          <div class="hm-tip__province">${data.province} Province</div>
          <div class="hm-tip__badge-row">
            <span class="hm-tip__badge" style="background:${color}">${LEVEL_LABELS[level].toUpperCase()}</span>
          </div>
          <div class="hm-tip__crimes"><strong>${crimes.toLocaleString()}</strong> incidents (filtered)</div>
        </div>
      `);
    });
  }, [summaryMap]);

  // Layer real DBSCAN heatmap points
  useEffect(() => {
    if (!mapRef.current || !heatPoints.length) return;
    heatLayerRef.current.forEach(c => c.remove());
    heatLayerRef.current = [];
    heatPoints.forEach(pt => {
      const c = L.circleMarker([pt.lat, pt.lng], {
        radius:      3.5,
        fillColor:   "#f97316",
        color:       "transparent",
        fillOpacity: 0.40,
        interactive: false,   // don't intercept mouse events — let district circles through
        pane:        "dbscanPane",
      }).addTo(mapRef.current);
      heatLayerRef.current.push(c);
    });
  }, [heatPoints]);

  useEffect(() => {
    Object.entries(markersRef.current).forEach(([, { circle, data }]) => {
      const api = summaryMap[data.name];
      const effectiveLevel = api?.level ?? data.level;
      const inDistrict = districtFilter.length === 0 || districtFilter.includes(data.name);
      const inLevel = levelFilter === "all" || effectiveLevel === Number(levelFilter);

      if (inDistrict && inLevel) {
        circle.setStyle({ fillOpacity: 0.82, opacity: 1 });
      } else {
        circle.setStyle({ fillOpacity: 0.06, opacity: 0.12 });
      }
    });
  }, [districtFilter, levelFilter, summaryMap]);

  return (
    <div className="heatmap-container-main">
      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
      <div className="heatmap-legend">
        <div className="legend-header">Risk Levels</div>
        <div className="legend-list">
          {[4, 3, 2, 1].map(lv => (
            <div className="legend-item" key={lv}>
              <span className="legend-color" style={{ background: LEVEL_COLORS[lv] }} />
              <span className="legend-label-text">{LEVEL_LABELS[lv]}</span>
              <span className="legend-dist-count">
                {districtList.filter(d => d.level === lv).length}d
              </span>
            </div>
          ))}
        </div>
        <div className="legend-size-note">● size = incident volume</div>
        <div className="legend-size-note" style={{marginTop:4}}>
          <span style={{color:"#f97316",fontWeight:700}}>●</span> DBSCAN crime points
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Main Heatmap Page
───────────────────────────────────────────────────────────────── */
const Heatmap = () => {
  const [selectedCrimes,    setSelectedCrimes]    = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [levelFilter,       setLevelFilter]       = useState("all");
  const [timePeriod,        setTimePeriod]        = useState("30 Days");
  const [dropdownOpen,      setDropdownOpen]      = useState(false);
  const [hotspotData,       setHotspotData]       = useState(null);
  const [apiLoading,        setApiLoading]        = useState(false);
  const [recentAlerts,      setRecentAlerts]      = useState([]);
  const [alertsLoading,     setAlertsLoading]     = useState(false);

  // ── Build API params from current filters and call /hotspots ──
  const loadHotspots = useCallback(async (crimesSel, period) => {
    setApiLoading(true);
    try {
      // Expand UI labels to DB crime_type strings
      const crimeTypes = crimesSel.length
        ? crimesSel.flatMap(label => CRIME_TYPE_MAP[label] || [])
        : undefined;

      const payload = {
        ...(crimeTypes?.length  && { crime_types: crimeTypes }),
        ...(period !== "All Time" && { time_period_days: TIME_PERIOD_DAYS[period] }),
      };

      const res = await getHotspots(payload);
      setHotspotData(res.data);
    } catch {}
    finally { setApiLoading(false); }
  }, []);

  // ── Re-fire whenever ANY filter changes ──
  useEffect(() => {
    loadHotspots(selectedCrimes, timePeriod);
  }, [selectedCrimes, timePeriod, loadHotspots]);

  useEffect(() => {
    const loadRecentAlerts = async () => {
      setAlertsLoading(true);
      try {
        const params = {
          limit: 5,
          ...(selectedDistricts.length > 0 && { districts: selectedDistricts.join(",") }),
          ...(levelFilter !== "all" && { level: levelFilter }),
        };
        const res = await getRecentAlerts(params);
        setRecentAlerts(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        setRecentAlerts([]);
      } finally {
        setAlertsLoading(false);
      }
    };

    loadRecentAlerts();
  }, [selectedDistricts, levelFilter]);

  const crimeTypes    = ["Theft", "Assault", "Robbery", "Fraud", "Drug-related", "Harassment"];
  const districtNames = districtList.map(d => d.name).sort();

  // ── Province look-up by district name ──
  const DISTRICT_PROVINCE = Object.fromEntries(districtList.map(d => [d.name, d.province]));

  // ── Derive all stats from API district_summary when available ──
  const apiSummary      = hotspotData?.district_summary ?? [];
  const hasApiResponse  = Array.isArray(hotspotData?.district_summary);
  const usingApi        = hasApiResponse;

  const displaySummary = usingApi
    ? apiSummary
    : districtList.map(d => ({ district: d.name, level: d.level, count: d.crimes }));

  const statsSummary = displaySummary
    .filter(d => selectedDistricts.length === 0 || selectedDistricts.includes(d.district || d.name))
    .filter(d => levelFilter === "all" || d.level === Number(levelFilter));

  const levelCounts = [4, 3, 2, 1].map(lv => {
    const matching = statsSummary.filter(d => d.level === lv);
    return {
      level:  lv,
      count:  matching.length,
      crimes: matching.reduce((s, d) => s + d.count, 0),
    };
  });

  const totalIncidents = statsSummary.reduce((s, d) => s + d.count, 0);

  const criticalCount = statsSummary.filter(d => d.level === 4).length;

  const safeCount = statsSummary.filter(d => d.level === 1).length;

  const topRisky = [...statsSummary]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(d => ({
      name:     d.district || d.name,
      province: DISTRICT_PROVINCE[d.district || d.name] || "",
      level:    d.level,
      crimes:   d.count,
      trend:    ALL_DISTRICTS[
        Object.keys(ALL_DISTRICTS).find(k => ALL_DISTRICTS[k].name === (d.district || d.name))
      ]?.trend || 0,
    }));

  const topSafe = [...statsSummary]
    .sort((a, b) => a.count - b.count)
    .slice(0, 5)
    .map(d => ({
      name:     d.district || d.name,
      province: DISTRICT_PROVINCE[d.district || d.name] || "",
      level:    d.level,
      crimes:   d.count,
      trend:    ALL_DISTRICTS[
        Object.keys(ALL_DISTRICTS).find(k => ALL_DISTRICTS[k].name === (d.district || d.name))
      ]?.trend || 0,
    }));

  const toggleDistrict = (d) =>
    setSelectedDistricts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleReset = () => {
    setSelectedCrimes([]);
    setSelectedDistricts([]);
    setLevelFilter("all");
    setTimePeriod("30 Days");
  };

  return (
    <div className="heatmap-page">

      {/* ── Nav ── */}
      <CitizenNavbar />

      <div className="main-layout">

        {/* ── LEFT — Filters ── */}
        <aside className="filters-panel">
          <div className="filter-header">
            <Filter size={17} />
            <h2>Filter Data</h2>
          </div>

          <div className="filter-group">
            <label>DISTRICT</label>
            <div className="district-dropdown-container" onMouseLeave={() => setDropdownOpen(false)}>
              <div className="district-selected"
                onClick={() => setDropdownOpen(o => !o)}
                tabIndex={0} role="button" aria-expanded={dropdownOpen}>
                {selectedDistricts.length > 0 ? (
                  <div className="selected-list">
                    {selectedDistricts.map(d => (
                      <span key={d} className="selected-tag">
                        {d}
                        <button type="button" className="remove-btn"
                          onClick={e => { e.stopPropagation(); toggleDistrict(d); }}>✕</button>
                      </span>
                    ))}
                  </div>
                ) : <span className="placeholder">All districts</span>}
              </div>
              {dropdownOpen && (
                <div className="district-options" role="listbox">
                  {districtNames.map(name => (
                    <label key={name} className="district-option" role="option">
                      <input type="checkbox"
                        checked={selectedDistricts.includes(name)}
                        onChange={() => toggleDistrict(name)} />
                      <span className="option-text">{name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label>RISK LEVEL</label>
            <div className="risk-level-btns">
              {[
                ["all", "All",       null],
                ["4",  "Critical",   "#ef4444"],
                ["3",  "High Risk",  "#f97316"],
                ["2",  "Moderate",   "#eab308"],
                ["1",  "Safe",       "#22c55e"],
              ].map(([val, lbl, color]) => (
                <button key={val}
                  className={`risk-btn ${levelFilter === val ? "risk-btn--active" : ""}`}
                  style={levelFilter === val && color
                    ? { background: color, borderColor: color, color: "#fff" }
                    : {}}
                  onClick={() => setLevelFilter(val)}>
                  {color && <span className="risk-btn-dot" style={{ background: color }} />}
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>CRIME TYPE</label>
            <div className="crime-tags">
              {crimeTypes.map(type => (
                <button key={type}
                  className={`tag ${selectedCrimes.includes(type) ? "active" : ""}`}
                  onClick={() => setSelectedCrimes(prev =>
                    prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>TIME PERIOD</label>
            <div className="time-buttons">
              {["7 Days", "30 Days", "6 Mo", "1 Year"].map(p => (
                <button key={p} className={timePeriod === p ? "active" : ""}
                  onClick={() => setTimePeriod(p)}>{p}</button>
              ))}
            </div>
          </div>

          <button className="reset-btn-full" onClick={handleReset}>
            <RefreshCw size={14} /> Reset Filters
          </button>
        </aside>

        {/* ── CENTER — Map ── */}
        <main className="map-section">
          <div className="map-header">
            <div>
              <h1 className="map-title">Sri Lanka Crime Safety Heatmap</h1>
              <p className="map-subtitle">
                AI-powered risk visualization across all 25 districts &nbsp;·&nbsp;
                {apiLoading ? "Loading…" : `${totalIncidents.toLocaleString()} incidents (filtered)`}
              </p>
            </div>
            <div className="live-badge">
              <span className="pulse" /> Live
            </div>
          </div>

          <SriLankaHeatmap
            districtFilter={selectedDistricts}
            levelFilter={levelFilter}
            heatPoints={hotspotData?.heatmap_points || []}
            districtSummary={displaySummary}
            hasApiResponse={hasApiResponse}
          />

          <div className="level-summary-bar">
            {levelCounts.map(({ level, count, crimes }) => (
              <div key={level} className="level-summary-item"
                style={{ borderColor: LEVEL_COLORS[level], background: LEVEL_BG[level] }}>
                <span className="level-dot" style={{ background: LEVEL_COLORS[level] }} />
                <div className="level-summary-body">
                  <span className="level-summary-name" style={{ color: LEVEL_TEXT[level] }}>
                    {LEVEL_LABELS[level]}
                  </span>
                  <span className="level-summary-meta" style={{ color: LEVEL_TEXT[level] }}>
                    {count} district{count !== 1 ? "s" : ""} · {crimes.toLocaleString()} incidents
                  </span>
                </div>
              </div>
            ))}
          </div>

          {hotspotData?.clusters?.length > 0 && (
            <div className="dbscan-strip">
              <div className="dbscan-strip-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                DBSCAN Cluster Analysis
              </div>
              {hotspotData.clusters.map(c => (
                <div key={c.cluster_id} className="dbscan-cluster-chip">
                  <span
                    className="dbscan-risk-badge"
                    style={{ background: RISK_COLORS[c.risk_level] || "#94a3b8" }}
                  >{c.risk_level}</span>
                  <span className="dbscan-chip-info">
                    <strong>{c.top_district}</strong> · {c.top_crime} · {c.top_location} · Peak: {c.peak_time}
                  </span>
                  <span className="dbscan-chip-incidents">{c.incidents.toLocaleString()} incidents</span>
                </div>
              ))}
              <span className="dbscan-strip-meta">
                {hotspotData.total_incidents.toLocaleString()} total incidents
                &nbsp;·&nbsp; {hotspotData.heatmap_points?.length} geo-tagged points plotted
              </span>
            </div>
          )}

          <p className="map-footer-info">
            Hover over circles to inspect district data &nbsp;·&nbsp;
            Orange dots = DBSCAN crime geo-tags &nbsp;·&nbsp;
            Data: Sri Lanka Police Department
          </p>
        </main>

        {/* ── RIGHT — Statistics ── */}
        <aside className="stats-panel">

          <div className="stats-overview">
            <div className="stats-overview-item">
              <span className="stats-overview-num">
                {apiLoading ? "…" : totalIncidents.toLocaleString()}
              </span>
              <span className="stats-overview-label">Total Incidents</span>
            </div>
            <div className="stats-overview-div" />
            <div className="stats-overview-item">
              <span className="stats-overview-num">25</span>
              <span className="stats-overview-label">Districts</span>
            </div>
            <div className="stats-overview-div" />
            <div className="stats-overview-item">
              <span className="stats-overview-num" style={{ color: "#dc2626" }}>
                {apiLoading ? "…" : criticalCount}
              </span>
              <span className="stats-overview-label">Critical</span>
            </div>
            <div className="stats-overview-div" />
            <div className="stats-overview-item">
              <span className="stats-overview-num" style={{ color: "#16a34a" }}>
                {apiLoading ? "…" : safeCount}
              </span>
              <span className="stats-overview-label">Safe Zones</span>
            </div>
          </div>

          <div className="rank-section">
            <div className="rank-header rank-header--danger">
              <AlertTriangle size={14} />
              <span>Highest Risk Districts</span>
            </div>
            {topRisky.map((d, i) => (
              <div key={d.name} className="rank-item">
                <span className="rank-num rank-num--danger">{i + 1}</span>
                <div className="rank-info">
                  <span className="rank-name">{d.name}</span>
                  <span className="rank-province">{d.province}</span>
                </div>
                <div className="rank-right">
                  <span className="rank-badge" style={{ background: LEVEL_COLORS[d.level], color: "#fff" }}>
                    {LEVEL_LABELS[d.level]}
                  </span>
                  <span className="rank-crimes">{d.crimes.toLocaleString()}</span>
                  {d.trend > 0
                    ? <span className="rank-trend rank-trend--up"><TrendingUp size={10} /> +{d.trend}%</span>
                    : <span className="rank-trend rank-trend--down"><TrendingDown size={10} /> {d.trend}%</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="rank-section">
            <div className="rank-header rank-header--safe">
              <ShieldCheck size={14} />
              <span>Safest Districts</span>
            </div>
            {topSafe.map((d, i) => (
              <div key={d.name} className="rank-item">
                <span className="rank-num rank-num--safe">{i + 1}</span>
                <div className="rank-info">
                  <span className="rank-name">{d.name}</span>
                  <span className="rank-province">{d.province}</span>
                </div>
                <div className="rank-right">
                  <span className="rank-badge" style={{ background: LEVEL_COLORS[d.level], color: "#fff" }}>
                    {LEVEL_LABELS[d.level]}
                  </span>
                  <span className="rank-crimes">{d.crimes.toLocaleString()}</span>
                  {d.trend < 0
                    ? <span className="rank-trend rank-trend--down"><TrendingDown size={10} /> {d.trend}%</span>
                    : <span className="rank-trend rank-trend--neutral">→ {d.trend}%</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="rank-section">
            <div className="rank-header rank-header--alert">
              <Activity size={14} />
              <span>Recent Alerts</span>
            </div>
            {alertsLoading && recentAlerts.length === 0 && (
              <div className="alert-item">
                <div className="alert-body">
                  <span className="alert-msg">Loading alerts...</span>
                </div>
              </div>
            )}
            {!alertsLoading && recentAlerts.length === 0 && (
              <div className="alert-item">
                <div className="alert-body">
                  <span className="alert-msg">No recent alerts for selected filters</span>
                </div>
              </div>
            )}
            {recentAlerts.map((a, i) => (
              <div key={i} className="alert-item">
                <span className="alert-dot" style={{ background: LEVEL_COLORS[a.level] || LEVEL_COLORS[2] }} />
                <div className="alert-body">
                  <span className="alert-district">{a.district}</span>
                  <span className="alert-msg">{a.msg}</span>
                  <span className="alert-time">{formatTimeAgo(a.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

        </aside>
      </div>

      <CitizenFooter />

    </div>
  );
};

export default Heatmap;
