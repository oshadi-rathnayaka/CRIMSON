import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import { api } from "../../lib/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/Citizen/ReportingSubmit.css";

/* ── Severity badge colours ── */
const SEVERITY_MAP = {
  theft: { label: "High Priority", color: "high" },
  assault:    { label: "High Priority",   color: "high" },
  harassment: { label: "High Priority",   color: "high" },
  cybercrime: { label: "Medium Priority", color: "medium" },
  bribery:    { label: "Medium Priority", color: "medium" },
  traffic:    { label: "Low Priority",    color: "low" },
  drug:       { label: "High Priority",   color: "high" },
};

const CATEGORY_LABELS = {
  theft:      "Theft / Burglary",
  assault:    "Physical Assault",
  harassment: "Sexual Harassment",
  cybercrime: "Cybercrime",
  bribery:    "Bribery / Corruption",
  traffic:    "Traffic Violation",
  drug:       "Drug / Narcotics",
};

const formatBytes = (b) => {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} MB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type = "") => {
  if (type.startsWith("image/")) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  );
  if (type.startsWith("video/")) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  );
};

/* ── Date/time helpers ── */
const formatDate = (d) =>
  d.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
const formatTime = (d) =>
  d.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", hour12: true });

const ReportingSubmit = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user: authUser } = useAuth();

  const now = new Date();
  const category    = state?.category    || "incident";
  const location    = state?.location    || null;
  const description = state?.description || "";
  const files       = state?.files       || [];
  const date        = formatDate(now);
  const time        = formatTime(now);
  const user        = { name: authUser?.fullName || "Unknown", id: authUser?._id || "" };

  const [declared, setDeclared]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [declareErr, setDeclareErr] = useState(false);
  const [submitErr, setSubmitErr]  = useState("");

  const mapRef = useRef(null);
  const mapInitRef = useRef(false);

  const severity = SEVERITY_MAP[category] || { label: "Medium Priority", color: "medium" };
  const catLabel = CATEGORY_LABELS[category] || category;

  /* ── Mini map (Leaflet) ── */
  useEffect(() => {
    if (mapInitRef.current || !mapRef.current) return;
    const coords = location?.coords || { lat: 6.9271, lng: 79.8612 };

    // Fix missing default icons
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    mapInitRef.current = true;
    const map = L.map(mapRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 14,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    L.marker([coords.lat, coords.lng]).addTo(map);

    return () => { map.remove(); mapInitRef.current = false; };
  }, [location]);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!declared) { setDeclareErr(true); return; }
    if (!description.trim()) {
      setSubmitErr("Your incident description is missing. Please go back to Step 3 and fill it in.");
      return;
    }
    setSubmitErr("");
    setLoading(true);
    try {
      const res = await api.post("/reports/submit", {
        category,
        description,
        location,
        files,
      });
      const data = res.data?.data;
      const caseId = data?.caseId;
      const submittedAt = data?.submittedAt;
      const submittedDate = submittedAt ? formatDate(new Date(submittedAt)) : date;
      const submittedTime = submittedAt ? formatTime(new Date(submittedAt)) : time;
      navigate("/report/confirmation", {
        state: { caseId, category, catLabel, location, date: submittedDate, time: submittedTime, severity },
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Unexpected error";
      console.error("[ReportingSubmit] Submit failed:", msg);
      setSubmitErr(`Failed to submit report: ${msg}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rs-page">
      {/* ── Navbar ── */}
      <CitizenNavbar />

      <main className="rs-main">
        <div className="rs-container">

          {/* ── Progress ── */}
          <div className="rs-progress-block">
            <div className="rs-progress-top">
              <span className="rs-progress-label">STEP 4 OF 4</span>
              <span className="rs-progress-status">Review &amp; Submit</span>
            </div>
            <div className="rs-progress-bar">
              <div className="rs-progress-fill" style={{ width: "100%" }}/>
            </div>
          </div>

          {/* ── Heading ── */}
          <h1 className="rs-heading">Review Your Report</h1>
          <p className="rs-subheading">
            Please verify the details below carefully. This information will be submitted directly to the Sri Lanka Police for processing.
          </p>

          {/* ── Two-column body ── */}
          <div className="rs-body">

            {/* LEFT column */}
            <div className="rs-col-left">

              {/* Incident Overview */}
              <div className="rs-card">
                <div className="rs-card__header">
                  <div className="rs-card__title-row">
                    <span className="rs-card__icon rs-card__icon--red">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </span>
                    <span className="rs-card__title">Incident Overview</span>
                  </div>
                  <button className="rs-edit-btn" onClick={() => navigate("/report", { state: { category } })}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                </div>
                <div className="rs-card__body">
                  <div className="rs-meta-grid">
                    <div className="rs-meta-item">
                      <span className="rs-meta-label">CATEGORY</span>
                      <span className="rs-meta-value rs-meta-value--bold">{catLabel}</span>
                    </div>
                    <div className="rs-meta-item">
                      <span className="rs-meta-label">SEVERITY</span>
                      <span className={`rs-severity rs-severity--${severity.color}`}>{severity.label}</span>
                    </div>
                    <div className="rs-meta-item">
                      <span className="rs-meta-label">DATE</span>
                      <span className="rs-meta-value">{date}</span>
                    </div>
                    <div className="rs-meta-item">
                      <span className="rs-meta-label">TIME</span>
                      <span className="rs-meta-value">{time}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="rs-card">
                <div className="rs-card__header">
                  <div className="rs-card__title-row">
                    <span className="rs-card__icon rs-card__icon--red">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </span>
                    <span className="rs-card__title">Location</span>
                  </div>
                  <button className="rs-edit-btn" onClick={() => navigate("/report/location", { state: { category, location } })}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                </div>
                <div className="rs-card__body rs-card__body--no-pad">
                  <div ref={mapRef} className="rs-mini-map"/>
                  <div className="rs-location-strip">
                    <span className="rs-location-strip__pin">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e02020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </span>
                    <span className="rs-location-strip__addr">{location?.address || "Location not set"}</span>
                  </div>
                </div>
              </div>

              {/* Statement */}
              <div className="rs-card">
                <div className="rs-card__header">
                  <div className="rs-card__title-row">
                    <span className="rs-card__icon rs-card__icon--red">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </span>
                    <span className="rs-card__title">Statement</span>
                  </div>
                  <button className="rs-edit-btn" onClick={() => navigate("/report/evidence", { state: { category, location, description, files } })}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                </div>
                <div className="rs-card__body">
                  <p className="rs-statement-text">{description}</p>
                </div>
              </div>
            </div>

            {/* RIGHT column */}
            <div className="rs-col-right">

              {/* Evidence */}
              <div className="rs-card">
                <div className="rs-card__header">
                  <div className="rs-card__title-row">
                    <span className="rs-card__icon rs-card__icon--red">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                      </svg>
                    </span>
                    <span className="rs-card__title">Evidence</span>
                  </div>
                  <button className="rs-edit-btn" onClick={() => navigate("/report/evidence", { state: { category, location, description, files } })}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
                <div className="rs-card__body rs-card__body--tight">
                  {files.length === 0 ? (
                    <p className="rs-no-evidence">No evidence uploaded.</p>
                  ) : (
                    files.map((f, i) => (
                      <div key={i} className="rs-evidence-item">
                        <span className={`rs-evidence-item__icon rs-evidence-item__icon--${f.type?.startsWith("image/") ? "img" : f.type?.startsWith("video/") ? "vid" : "aud"}`}>
                          {getFileIcon(f.type)}
                        </span>
                        <div className="rs-evidence-item__info">
                          <span className="rs-evidence-item__name">{f.name}</span>
                          <span className="rs-evidence-item__size">{formatBytes(f.size)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reporting As */}
              <div className="rs-card">
                <div className="rs-card__header">
                  <div className="rs-card__title-row">
                    <span className="rs-card__title rs-card__title--sm">REPORTING AS</span>
                  </div>
                </div>
                <div className="rs-card__body rs-card__body--tight">
                  <div className="rs-reporter">
                    <span className="rs-reporter__avatar">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <div className="rs-reporter__info">
                      <span className="rs-reporter__name">{user.name}</span>
                      <span className="rs-reporter__id">ID: {user.id}</span>
                    </div>
                  </div>
                  <div className="rs-privacy-note">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e02020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>Your identity will be kept confidential according to the Witness Protection Act.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Declaration + Submit ── */}
          <div className="rs-submit-section">
            <label className={`rs-declare-row ${declareErr ? "rs-declare-row--error" : ""}`}>
              <input
                type="checkbox"
                className="rs-declare-checkbox"
                checked={declared}
                onChange={(e) => { setDeclared(e.target.checked); if (e.target.checked) setDeclareErr(false); }}
              />
              <span className="rs-declare-label">
                I hereby declare that the information provided is true and accurate to the best of my knowledge.
              </span>
            </label>
            {declareErr && (
              <p className="rs-declare-err">You must declare the information is accurate before submitting.</p>
            )}
            {submitErr && (
              <p className="rs-declare-err">{submitErr}</p>
            )}
            <p className="rs-legal-note">
              Filing a false police report is a punishable offense under the Sri Lanka Penal Code.
            </p>

            <div className="rs-submit-actions">
              <button
                type="button"
                className="rs-back-btn"
                onClick={() => navigate("/report/evidence", { state: { category, location, description, files } })}
              >
                Back to Edit
              </button>
              <button
                type="button"
                className={`rs-submit-btn ${loading ? "rs-submit-btn--loading" : ""}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <><span className="rs-spinner"/><span>Submitting…</span></>
                ) : (
                  <>
                    Submit Report
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>

      <CitizenFooter />
    </div>
  );
};

export default ReportingSubmit;