import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/ReportingCategory.css";
import { categorizeReport } from "../../api/analytics";

const CATEGORIES = [
  {
    id: "theft",
    label: "Theft / Robbery",
    description: "Burglary, shoplifting, or stolen property.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    id: "assault",
    label: "Physical Assault",
    description: "Bodily harm, fights, or domestic violence.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "harassment",
    label: "Sexual Harassment",
    description: "Unwanted conduct or stalking.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
  },
  {
    id: "cybercrime",
    label: "Cybercrime",
    description: "Hacking, online fraud, or identity theft.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M9 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "bribery",
    label: "Bribery / Corruption",
    description: "Soliciting bribes or misuse of power.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: "traffic",
    label: "Traffic Violation",
    description: "Accidents, hit-and-run, or reckless driving.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    id: "drug",
    label: "Drug / Narcotics",
    description: "Possession, trafficking, or supply of illegal substances.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 2h3v20h-3z" transform="rotate(45 12 12)"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
  },
];

// Maps NLP model output → CATEGORIES id
// Includes all actual model class names (from trained/nlp_pipeline.pkl classes_)
const NLP_TO_ID = {
  // ── Actual model output classes ──────────────────────────
  "Cattle Theft":               "theft",
  "Cheating/BCT":               "bribery",
  "Drug Offences (Cannabis)":   "drug",
  "Drug Offences (Heroin)":     "drug",
  "Drug Offences (Ice/Meth)":   "drug",
  "Grievous Hurt":              "assault",
  "Homicide":                   "assault",
  "House Breaking":             "theft",
  "Property Theft":             "theft",
  "Robbery":                    "theft",
  "Statutory Rape":             "harassment",
  // ── Generic aliases (fallback) ───────────────────────────
  "Theft":             "theft",   "Burglary":          "theft",
  "Snatching":         "theft",
  "Assault":           "assault", "Physical Assault":  "assault",
  "Bodily Harm":       "assault", "Domestic Violence": "assault",
  "Sexual Harassment": "harassment", "Harassment":    "harassment",
  "Stalking":          "harassment",
  "Cybercrime":        "cybercrime", "Hacking":        "cybercrime",
  "Online Fraud":      "cybercrime", "Fraud":          "cybercrime",
  "Identity Theft":    "cybercrime", "Cyber Crime":    "cybercrime",
  "Bribery":           "bribery",  "Corruption":      "bribery",
  "Traffic Violation": "traffic",  "Road Accident":   "traffic",
  "Hit and Run":       "traffic",
  "Drug Offences":     "drug",     "Narcotics":        "drug",
};

const ReportingCategory = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  // ── NLP Assistant state ───────────────────────────────────
  const [aiOpen,    setAiOpen]    = useState(false);
  const [aiText,    setAiText]    = useState("");
  const [aiResult,  setAiResult]  = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!aiText.trim() || aiText.trim().length < 10) {
      setAiResult(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await categorizeReport(aiText.trim());
        setAiResult(res.data);
      } catch {
        setAiResult(null);
      } finally {
        setAiLoading(false);
      }
    }, 650);
    return () => clearTimeout(debounceRef.current);
  }, [aiText]);

  const handleUseAiCategory = () => {
    if (!aiResult?.category) return;
    const id = NLP_TO_ID[aiResult.category];
    if (id) {
      setSelected(id);
      setAiOpen(false);
    }
  };

  const handleNext = () => {
    if (!selected) return;
    navigate("/report/details", { state: { category: selected } });
  };

  return (
    <div className="rc-page">
      <CitizenNavbar />

      {/* Content */}
      <main className="rc-main">
        <div className="rc-container">

          {/* Progress */}
          <div className="rc-progress-block">
            <div className="rc-progress-top">
              <span className="rc-progress-label">Step 1 of 4: Select Category</span>
              <span className="rc-progress-pct">25%</span>
            </div>
            <div className="rc-progress-bar">
              <div className="rc-progress-fill" style={{ width: "25%" }} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="rc-heading">What type of incident are you reporting?</h1>
          <p className="rc-subheading">
            Your report will be processed confidentially. If this is a life-threatening emergency, please dial{" "}
            <strong>119</strong> immediately.
          </p>

          {/* Category Grid */}
          <div className="rc-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`rc-card ${selected === cat.id ? "rc-card--selected" : ""}`}
                onClick={() => setSelected(cat.id)}
                aria-pressed={selected === cat.id}
              >
                <span className="rc-card__icon">{cat.icon}</span>
                <div className="rc-card__text">
                  <span className="rc-card__label">{cat.label}</span>
                  <span className="rc-card__desc">{cat.description}</span>
                </div>
              </button>
            ))}
          </div>

          {/* ── AI Assistant ── */}
          <div className="rc-ai-widget">
            {/* Header (always visible) */}
            <div className="rc-ai-widget__header" onClick={() => setAiOpen(o => !o)} role="button" tabIndex={0}
              onKeyDown={e => e.key === "Enter" && setAiOpen(o => !o)}>
              <span className="rc-ai-widget__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <path d="M9 9h.01M15 9h.01M9 15h6"/>
                </svg>
              </span>
              <div className="rc-ai-widget__htext">
                <span className="rc-ai-widget__htitle">Not sure which category? Let AI help</span>
                <span className="rc-ai-widget__hdesc">Describe the incident → AI suggests the right category (92.38% accuracy)</span>
              </div>
              <span className={`rc-ai-widget__chevron ${aiOpen ? "open" : ""}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>

            {/* Expandable body */}
            {aiOpen && (
              <div className="rc-ai-widget__body">
                <textarea
                  className="rc-ai-widget__input"
                  placeholder="Describe the incident… e.g. &quot;Someone broke into my house at night and stole my laptop&quot;"
                  rows={3}
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  autoFocus
                />

                {/* Loading */}
                {aiLoading && (
                  <div className="rc-ai-status">
                    <span className="rc-ai-spinner"/>
                    <span>Analysing with NLP model…</span>
                  </div>
                )}

                {/* Result */}
                {!aiLoading && aiResult && (
                  <div className="rc-ai-result">
                    {/* Primary suggestion */}
                    <div className="rc-ai-primary">
                      <div className="rc-ai-primary__left">
                        <span className="rc-ai-label">AI Suggests</span>
                        <span className="rc-ai-cat">{aiResult.category}</span>
                      </div>
                      <div className="rc-ai-primary__right">
                        <span className="rc-ai-conf-bar-wrap">
                          <span className="rc-ai-conf-bar-fill"
                            style={{ width: `${Math.round(aiResult.confidence * 100)}%` }}/>
                        </span>
                        <span className="rc-ai-conf-pct">{Math.round(aiResult.confidence * 100)}% confidence</span>
                      </div>
                      {NLP_TO_ID[aiResult.category] && (
                        <button className="rc-ai-use-btn" onClick={handleUseAiCategory}>
                          Use This Category ✓
                        </button>
                      )}
                    </div>

                    {/* Top 3 alternatives */}
                    {aiResult.top3?.length > 1 && (
                      <div className="rc-ai-alts">
                        <span className="rc-ai-alts__label">Alternatives</span>
                        {aiResult.top3.slice(1).map(t => (
                          <div key={t.category} className="rc-ai-alt-row">
                            <span className="rc-ai-alt-name">{t.category}</span>
                            <span className="rc-ai-alt-bar-wrap">
                              <span className="rc-ai-alt-bar-fill"
                                style={{ width: `${Math.round(t.confidence * 100)}%` }}/>
                            </span>
                            <span className="rc-ai-alt-pct">{Math.round(t.confidence * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="rc-ai-footer-note">Model accuracy: {aiResult.accuracy}% · NLP pipeline v1</p>
                  </div>
                )}

                {/* Hint when text is too short */}
                {!aiLoading && !aiResult && aiText.trim().length > 0 && aiText.trim().length < 10 && (
                  <p className="rc-ai-hint">Type at least 10 characters for a suggestion…</p>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="rc-nav-actions">
            <button type="button" className="rc-back-btn" onClick={() => navigate("/dashboard")}>
              Back
            </button>
            <button
              type="button"
              className={`rc-next-btn ${!selected ? "rc-next-btn--disabled" : ""}`}
              onClick={handleNext}
              disabled={!selected}
            >
              Next Step
            </button>
          </div>

        </div>
      </main>

      <CitizenFooter />
    </div>
  );
};

export default ReportingCategory;