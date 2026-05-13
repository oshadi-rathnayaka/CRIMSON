import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Officer/Case.css";
import { getRecidivism } from "../../api/analytics";

// --- Icon Components (inline SVGs) ---
const Icon = ({ name, size = 16 }) => {
  const icons = {
    home: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    grid: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
    folder: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    ),
    user: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    activity: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    bar_chart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    message: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    map_pin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    clipboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      </svg>
    ),
    clock: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    print: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
      </svg>
    ),
    edit: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    eye: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    plus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    bold: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/>
      </svg>
    ),
    list: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    paperclip: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
      </svg>
    ),
    chevron_right: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    ),
    shield: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    network: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="12" cy="12" r="2"/>
        <line x1="12" y1="7" x2="12" y2="10"/><line x1="10.5" y1="13.5" x2="6.5" y2="17.5"/><line x1="13.5" y1="13.5" x2="17.5" y2="17.5"/>
      </svg>
    ),
    link: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    warrant: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
      </svg>
    ),
    person_add: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
    check_circle: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    bulb: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/>
      </svg>
    ),
    upload: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
      </svg>
    ),
    file: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/>
      </svg>
    ),
    video: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    archive: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
      </svg>
    ),
  };
  return icons[name] || null;
};

// --- Map Placeholder ---
const MapPlaceholder = () => (
  <div className="map-placeholder">
    <div className="map-grid">
      {Array.from({ length: 120 }).map((_, i) => (
        <div key={i} className="map-cell" />
      ))}
    </div>
    <div className="map-pin-marker">
      <div className="map-pin-dot" />
      <div className="map-pin-pulse" />
    </div>
    <span className="map-district-label">District 4</span>
  </div>
);

// --- Recidivism Risk Widget ---
const RF_RISK_COLOR = { HIGH: "#e03131", MEDIUM: "#d97706", LOW: "#16a34a" };
const RF_RISK_BG    = { HIGH: "#fff0f0", MEDIUM: "#fffbeb", LOW: "#f0fdf4" };

const RecidivismWidget = () => {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecidivism({
      crime_type:            "Robbery",
      district:              "Colombo",
      victim_gender:         "Male",
      time_bracket:          "Night",
      location_type:         "Residential",
      lighting_level:        "Dark",
      offender_drug_history: "No",
      is_holiday:            0,
      cleared_rate_pct:      55.0,
      victim_age_bracket:    "26-35",
      year:                  2024,
    })
      .then(r => setResult(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pct   = result ? Math.round(result.probability * 100) : 0;
  const risk  = result?.risk_level || null;
  const color = RF_RISK_COLOR[risk] || "#6b7280";
  const bg    = RF_RISK_BG[risk]    || "#f3f4f6";

  // SVG arc gauge: 270° sweep
  const R = 48, CX = 60, CY = 60;
  const circ    = 2 * Math.PI * R;
  const arcLen  = circ * 0.75;
  const fillLen = arcLen * (pct / 100);

  return (
    <div className="card rf-widget">
      <div className="card-header">
        <span className="card-title">Reoffending Risk — AI Prediction</span>
        <span className="rf-model-badge">Random Forest</span>
      </div>
      <div className="rf-body">
        {loading ? (
          <div className="rf-loading">Analysing suspect profile…</div>
        ) : (
          <>
            {/* Gauge + level */}
            <div className="rf-gauge-wrap">
              <svg width="120" height="120" viewBox="0 0 120 120">
                {/* track */}
                <circle cx={CX} cy={CY} r={R}
                  fill="none" stroke="#e5e7eb" strokeWidth="9"
                  strokeDasharray={`${arcLen} ${circ}`}
                  strokeLinecap="round"
                  transform={`rotate(135 ${CX} ${CY})`}
                />
                {/* fill */}
                <circle cx={CX} cy={CY} r={R}
                  fill="none" stroke={color} strokeWidth="9"
                  strokeDasharray={`${fillLen} ${circ}`}
                  strokeLinecap="round"
                  transform={`rotate(135 ${CX} ${CY})`}
                  style={{ transition: "stroke-dasharray 0.9s ease" }}
                />
                <text x={CX} y={CY - 3} textAnchor="middle"
                  fontSize="20" fontWeight="700" fill={color}>{pct}%</text>
                <text x={CX} y={CY + 14} textAnchor="middle"
                  fontSize="9" fill="#9ca3af">probability</text>
              </svg>
              <span className="rf-level-badge" style={{ background: bg, color }}>
                {risk} RISK
              </span>
            </div>

            {/* Details */}
            <div className="rf-details">
              <div className="rf-suspect-row">
                <img src="https://i.pravatar.cc/36?img=8" alt="Sunil K" className="party-avatar" />
                <div>
                  <div className="rf-suspect-name">Sunil K. &mdash; Primary Suspect</div>
                  <div className="rf-suspect-meta">Armed Robbery &middot; Colombo &middot; Night</div>
                </div>
              </div>

              <div className="rf-probability-bar">
                <div className="rf-bar-labels">
                  <span>Reoffending probability</span>
                  <span style={{ color, fontWeight: 600 }}>{pct}%</span>
                </div>
                <div className="rf-bar-track">
                  <div className="rf-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>

              <div className="rf-rec-box" style={{ borderColor: color + "55", background: bg }}>
                <div className="rf-rec-label">Officer Recommendation</div>
                <div className="rf-rec-text">{result.recommendation}</div>
              </div>

              <div className="rf-accuracy">
                Powered by Random Forest
                &nbsp;&middot;&nbsp;
                <strong>92.65% accuracy</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- AI Insight Card ---
const AIInsightCard = () => (
  <div className="ai-insight-card">
    <div className="ai-insight-header">
      <span className="ai-insight-icon"><Icon name="bulb" size={14} /></span>
      <span className="ai-insight-tag">AI INSIGHT</span>
      <div className="ai-network-icon"><Icon name="network" size={40} /></div>
    </div>
    <h3 className="ai-insight-title">Potential Cross-District Link Found</h3>
    <p className="ai-insight-desc">
      Pattern analysis suggests a 94% match with <strong>Case #CR-2023-4412</strong> in
      Gampaha District. Similar MO and suspect description.
    </p>
    <div className="ai-insight-actions">
      <button className="btn btn-outline-light btn-sm">
        <Icon name="link" size={14} /> Link Cases
      </button>
      <button className="btn btn-ghost-light btn-sm">View Details</button>
    </div>
  </div>
);

// --- Evidence Vault ---
const evidenceItems = [
  { id: 1, label: "Forensic_Rep...", icon: "file", color: "ev-red" },
  { id: 2, label: "Site_Photo_01", icon: "file", color: "ev-blue" },
  { id: 3, label: "CCTV_Clip_04", icon: "video", color: "ev-purple" },
  { id: 4, label: "Archive_2023", icon: "archive", color: "ev-gray" },
];

const EvidenceVault = () => (
  <div className="card">
    <div className="card-header">
      <span className="card-title">Evidence Vault</span>
      <button className="icon-btn"><Icon name="plus" size={16} /></button>
    </div>
    <div className="evidence-grid">
      {evidenceItems.map((item) => (
        <div key={item.id} className="evidence-item">
          <div className={`evidence-icon-box ${item.color}`}>
            <Icon name={item.icon} size={22} />
          </div>
          <span className="evidence-label">{item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// --- Workflow Actions ---
const workflowActions = [
  { label: "Request Warrant", icon: "warrant" },
  { label: "Add Suspect", icon: "person_add" },
  { label: "Close Case", icon: "check_circle" },
];

const WorkflowActions = () => (
  <div className="card">
    <div className="card-header">
      <span className="card-title">Workflow Actions</span>
    </div>
    <div className="workflow-list">
      {workflowActions.map((action) => (
        <button key={action.label} className="workflow-action-btn">
          <span className="workflow-action-icon"><Icon name={action.icon} size={16} /></span>
          <span>{action.label}</span>
          <span className="workflow-chevron"><Icon name="chevron_right" size={16} /></span>
        </button>
      ))}
    </div>
  </div>
);

// --- Investigation Notes ---
const initialNotes = [
  {
    id: 1,
    title: "Suspect Interrogation Scheduled",
    time: "Today, 10:30 AM",
    body: "Arranged for primary suspect Sunil K. to be brought in for questioning regarding the inconsistencies in his initial statement.",
    officer: "Officer Perera",
    avatar: "https://i.pravatar.cc/28?img=5",
  },
  {
    id: 2,
    title: "Forensic Team Request",
    time: "Yesterday, 4:45 PM",
    body: "Requested expedited processing for fingerprints found on the window sill. Reference Request #REQ-992.",
    officer: "Officer Perera",
    avatar: "https://i.pravatar.cc/28?img=5",
  },
];

const InvestigationNotes = () => {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");

  const handleSave = () => {
    if (!draft.trim()) return;
    setNotes([
      {
        id: Date.now(),
        title: "New Observation",
        time: "Just now",
        body: draft,
        officer: "Officer Perera",
        avatar: "https://i.pravatar.cc/28?img=5",
      },
      ...notes,
    ]);
    setDraft("");
  };

  return (
    <div className="card notes-card">
      <div className="card-header">
        <span className="card-title">Investigation Notes</span>
        <button className="btn btn-link-sm">Official Log</button>
      </div>
      <div className="notes-composer">
        <textarea
          className="notes-textarea"
          placeholder="Log a new observation or update..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
        />
        <div className="notes-toolbar">
          <div className="notes-format-btns">
            <button className="icon-btn"><Icon name="bold" size={14} /></button>
            <button className="icon-btn"><Icon name="list" size={14} /></button>
            <button className="icon-btn"><Icon name="paperclip" size={14} /></button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            Save Note
          </button>
        </div>
      </div>
      <div className="notes-list">
        {notes.map((note) => (
          <div key={note.id} className="note-entry">
            <div className="note-entry-header">
              <span className="note-entry-title">{note.title}</span>
              <span className="note-entry-time">{note.time}</span>
            </div>
            <p className="note-entry-body">{note.body}</p>
            <div className="note-entry-officer">
              <img src={note.avatar} alt={note.officer} className="note-avatar" />
              <span>{note.officer}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Investigation Timeline ---
const timelineItems = [
  {
    id: 1,
    status: "done",
    title: "Evidence Securely Uploaded",
    desc: "CCTV footage from main entrance processed.",
    time: "10:15 AM",
  },
  {
    id: 2,
    status: "active",
    title: "Officer Perera On Scene",
    desc: "Initial perimeter established.",
    time: "09:30 AM",
  },
  {
    id: 3,
    status: "pending",
    title: "Incident Reported",
    desc: "Call received from centralized dispatch.",
    time: "08:00 AM",
  },
];

const InvestigationTimeline = () => (
  <div className="card">
    <div className="card-header">
      <span className="card-title">Investigation Timeline</span>
    </div>
    <div className="timeline">
      {timelineItems.map((item) => (
        <div key={item.id} className="timeline-item">
          <div className={`timeline-dot tl-${item.status}`} />
          <div className="timeline-content">
            <div className="timeline-row">
              <span className="timeline-title">{item.title}</span>
              <span className="timeline-time">{item.time}</span>
            </div>
            <p className="timeline-desc">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Main Case Component ---
const Case = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const c = location.state?.caseData || null;

  // Derived display values falling back to hardcoded defaults
  const caseId       = c?.id       || "#CR-2023-8921";
  const caseType     = c?.type     || "Robbery";
  const casePriority = c?.priority || "High";
  const caseLocation = c?.location || "Colombo District 4";
  const caseDate     = c?.date     || "12 Nov 2023";
  const caseOfficer  = c?.officer  || "Perera";
  const caseStatus   = c?.status   || "Under Investigation";

  return (
    <div className="case-page">

      <main className="main-content">
        {/* Top bar */}
        <div className="case-topbar">
          <div className="case-topbar-left">
            <button className="btn btn-ghost btn-back" onClick={() => navigate("/officer/cases")} style={{marginRight:8}}>
              ← Back
            </button>
            <h1 className="case-title">Case {caseId}: {caseType}</h1>
            <span className={`badge badge-priority priority-${casePriority.toLowerCase()}`}>{casePriority} Priority</span>
          </div>
          <div className="case-topbar-right">
            <button className="btn btn-ghost">
              <Icon name="print" size={15} /> Print Report
            </button>
            <button className="btn btn-primary">
              <Icon name="edit" size={15} /> Update Status
            </button>
          </div>
        </div>

        {/* Case meta */}
        <div className="case-meta">
          <span className="case-meta-item"><Icon name="map_pin" size={13} /> {caseLocation}</span>
          <span className="case-meta-item"><Icon name="clipboard" size={13} /> Assigned to Officer {caseOfficer}</span>
          <span className="case-meta-item"><Icon name="clock" size={13} /> Reported: {caseDate}</span>
        </div>

        {/* Body grid */}
        <div className="case-body">
          {/* Left column */}
          <div className="case-col-left">
            <MapPlaceholder />

            {/* Case Status */}
            <div className="card status-card">
              <div className="status-badge-row">
                <span className="status-indicator"><Icon name="search" size={13} /></span>
                <span className="status-text">{caseStatus}</span>
                <span className="status-since">Reported {caseDate}</span>
              </div>
              <table className="status-table">
                <tbody>
                  <tr>
                    <td className="st-label">Incident Type</td>
                    <td className="st-value">{caseType}</td>
                  </tr>
                  <tr>
                    <td className="st-label">Date</td>
                    <td className="st-value">{caseDate}</td>
                  </tr>
                  <tr>
                    <td className="st-label">Location</td>
                    <td className="st-value">{caseLocation}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Involved Parties */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Involved Parties</span>
                <button className="btn btn-link-sm">View All</button>
              </div>
              <div className="parties-list">
                <div className="party-item">
                  <img src="https://i.pravatar.cc/36?img=8" alt="Sunil K" className="party-avatar" />
                  <div className="party-info">
                    <span className="party-name">Sunil K.</span>
                    <span className="party-role suspect">Primary Suspect</span>
                  </div>
                  <button className="icon-btn ml-auto"><Icon name="eye" size={15} /></button>
                </div>
                <div className="party-item">
                  <img src="https://i.pravatar.cc/36?img=25" alt="Amara D" className="party-avatar" />
                  <div className="party-info">
                    <span className="party-name">Amara D.</span>
                    <span className="party-role witness">Witness</span>
                  </div>
                  <button className="icon-btn ml-auto"><Icon name="eye" size={15} /></button>
                </div>
              </div>
            </div>

            <EvidenceVault />
            <WorkflowActions />
          </div>

          {/* Right column */}
          <div className="case-col-right">
            <RecidivismWidget />
            <AIInsightCard />
            <InvestigationNotes />
            <InvestigationTimeline />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Case;