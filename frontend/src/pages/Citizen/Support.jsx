import React, { useState, useEffect } from "react";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import { api } from "../../lib/api";
import supportImg from "../../assets/support.svg";
import "../../styles/Citizen/Support.css";

/* ── Data ── */
const SUPPORT_SERVICES = [
  {
    id: "medical",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
    title: "Medical Assistance",
    desc: "Request immediate check-ups, forensic examinations, or documentation of injuries for legal purposes.",
    placeholder: "Please describe the medical assistance you need, including any injuries or health concerns you want documented…",
  },
  {
    id: "legal",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    iconColor: "#7c3aed",
    iconBg: "#ede9fe",
    title: "Legal Aid",
    desc: "Connect with public defenders, legal advisors, and support for restraining orders.",
    placeholder: "Describe the legal assistance you require, including any relevant case details, dates, or documents involved…",
  },
  {
    id: "counseling",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
    title: "Counseling & Trauma",
    desc: "Access trauma specialists, child psychologists, and mental health support groups.",
    placeholder: "Share what you are going through so we can connect you with the right specialist. All details are kept strictly confidential…",
  },
  {
    id: "welfare",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    iconColor: "#ea580c",
    iconBg: "#ffedd5",
    title: "Welfare Support",
    desc: "Apply for emergency financial aid, temporary housing, and relocation assistance.",
    placeholder: "Describe your current situation and the financial or housing assistance you need (e.g., emergency funds, shelter, relocation)…",
  },
];

const VICTIM_RESOURCES = [
  {
    title: "Rights of Victims Act",
    meta: "Quick Guide (.pdf)",
    icon: "📄",
    href: "/resources/rights-of-victims-act.pdf",
  },
  {
    title: "Legal Process Handbook",
    meta: "Citizen Handbook (.pdf)",
    icon: "📚",
    href: "/resources/legal-process-handbook.pdf",
  },
  {
    title: "Safety Planning Guide",
    meta: "Safety Checklist (.pdf)",
    icon: "🛡️",
    href: "/resources/safety-planning-guide.pdf",
  },
  {
    title: "Emergency Shelter Directory",
    meta: "District Contacts (.pdf)",
    icon: "🏠",
    href: "/resources/emergency-shelter-directory.pdf",
  },
  {
    title: "Witness Protection Info",
    meta: "Protection Overview (.pdf)",
    icon: "🧾",
    href: "/resources/witness-protection-info.pdf",
  },
  {
    title: "Psychosocial Support Map",
    meta: "Service Guide (.pdf)",
    icon: "🧠",
    href: "/resources/psychosocial-support-map.pdf",
  },
];

const SERVICE_MAP = Object.fromEntries(SUPPORT_SERVICES.map((s) => [s.id, s]));

const DISTRICT_OPTIONS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
];

const CRIME_TYPE_OPTIONS = [
  "Theft", "Assault", "Fraud", "Robbery", "Domestic Violence", "Cyber Crime",
  "Harassment", "Drug Possession", "Vandalism", "Other",
];

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

const STATUS_META = {
  submitted:    { label: "Submitted",    color: "#6b7280", bg: "#f3f4f6" },
  under_review: { label: "Under Review", color: "#d97706", bg: "#fef3c7" },
  assigned:     { label: "Assigned",     color: "#2563eb", bg: "#dbeafe" },
  completed:    { label: "Completed",    color: "#16a34a", bg: "#dcfce7" },
  closed:       { label: "Closed",       color: "#9ca3af", bg: "#f3f4f6" },
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });

/* ── Component ── */
export default function Support() {
  const [requests, setRequests]         = useState([]);
  const [reqLoading, setReqLoading]     = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalSvc, setModalSvc]         = useState(null);
  const [formAge, setFormAge]           = useState("");
  const [formGender, setFormGender]     = useState("Female");
  const [formCrimeType, setFormCrimeType] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formDesc, setFormDesc]         = useState("");
  const [formPriority, setFormPriority] = useState("normal");
  const [formLoading, setFormLoading]   = useState(false);
  const [formError, setFormError]       = useState("");
  const [formSuccess, setFormSuccess]   = useState(null);
  const [showAllResources, setShowAllResources] = useState(false);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setReqLoading(true);
    try {
      const res = await api.get("/support/my-requests");
      setRequests(res.data.data || []);
    } catch {
      setRequests([]);
    } finally {
      setReqLoading(false);
    }
  };

  const openModal = (svc) => {
    setModalSvc(svc);
    setFormAge("");
    setFormGender("Female");
    setFormCrimeType("");
    setFormDistrict("");
    setFormDesc("");
    setFormPriority("normal");
    setFormError("");
    setFormSuccess(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => { setModalSvc(null); setFormSuccess(null); }, 250);
  };

  const visibleResources = showAllResources
    ? VICTIM_RESOURCES
    : VICTIM_RESOURCES.slice(0, 3);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formAge || Number(formAge) < 0 || Number(formAge) > 120) { setFormError("Please enter a valid age."); return; }
    if (!formGender) { setFormError("Please select a gender."); return; }
    if (!formCrimeType) { setFormError("Please select a crime type."); return; }
    if (!formDistrict) { setFormError("Please select a district."); return; }
    if (!formDesc.trim()) { setFormError("Please describe what you need help with."); return; }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await api.post("/support/request", {
        serviceType:  modalSvc.id,
        serviceLabel: modalSvc.title,
        victimAge:    Number(formAge),
        victimGender: formGender,
        crimeType:    formCrimeType,
        district:     formDistrict,
        description:  formDesc.trim(),
        priority:     formPriority,
      });
      setFormSuccess({ ticketId: res.data.data.ticketId, serviceLabel: modalSvc.title });
      fetchRequests();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to submit request. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="sp-page">
      {/* ── Navbar ── */}
      <CitizenNavbar />

      {/* ── Hero Banner ── */}
      <section className="sp-hero">
        <div className="sp-hero__content">
          <p className="sp-hero__tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            24/7 Confidential Support
          </p>
          <h1 className="sp-hero__title">
            We are here to <span className="sp-hero__title--accent">support you</span>
          </h1>
          <p className="sp-hero__desc">
            Access secure, confidential assistance provided by the Sri Lanka Police &amp; Partner NGOs.
            You are not alone. Our team helps you navigate medical, legal, and emotional challenges.
          </p>
          <p className="sp-hero__encrypted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Your activity on this page is encrypted and confidential
          </p>
        </div>
        <div className="sp-hero__image-wrap">
          <img
            src={supportImg}
            alt="Support Center"
            className="sp-hero__img"
          />
          <div className="sp-hero__image-caption">
            <strong>Safe Haven Program</strong>
            <span>Community support center in Colombo</span>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="sp-main">

        {/* ── Support Services ── */}
        <section className="sp-services-section">
          <h2 className="sp-section-title">Available Support Services</h2>
          <p className="sp-section-sub">Select the type of assistance you need to start a confidential request.</p>
          <div className="sp-services-grid">
            {SUPPORT_SERVICES.map((svc) => (
              <div key={svc.id} className="sp-service-card">
                <div className="sp-service-card__icon" style={{ background: svc.iconBg, color: svc.iconColor }}>
                  {svc.icon}
                </div>
                <h3 className="sp-service-card__title">{svc.title}</h3>
                <p className="sp-service-card__desc">{svc.desc}</p>
                <button className="sp-service-card__link" onClick={() => openModal(svc)}>
                  Request Help
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom Two-Col ── */}
        <div className="sp-bottom-grid">

          {/* My Support Requests */}
          <section className="sp-requests-section">
            <div className="sp-requests-header">
              <h2 className="sp-section-title" style={{ marginBottom: 0 }}>My Support Requests</h2>
              <button className="sp-view-all" onClick={fetchRequests}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.95"/>
                </svg>
                Refresh
              </button>
            </div>

            <div className="sp-table-wrap">
              {reqLoading ? (
                <div className="sp-table-loading">
                  <span className="sp-spinner" />
                  Loading your requests…
                </div>
              ) : requests.length === 0 ? (
                <div className="sp-table-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <p>No support requests yet</p>
                  <span>Use the services above to submit your first request.</span>
                </div>
              ) : (
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Service Type</th>
                      <th>Ticket ID</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Crime Type</th>
                      <th>District</th>
                      <th>Priority</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => {
                      const svc    = SERVICE_MAP[req.serviceType] || {};
                      const status = STATUS_META[req.status] || STATUS_META.submitted;
                      return (
                        <tr key={req._id}>
                          <td>
                            <span className="sp-table-type" style={{ background: svc.iconBg, color: svc.iconColor }}>
                              {svc.icon && <span style={{ display: "flex" }}>{React.cloneElement(svc.icon, { width: 13, height: 13 })}</span>}
                              {req.serviceLabel || svc.title}
                            </span>
                          </td>
                          <td className="sp-table-id">{req.ticketId}</td>
                          <td>{req.victimAge ?? "-"}</td>
                          <td>{req.victimGender || "-"}</td>
                          <td>{req.crimeType || "-"}</td>
                          <td>{req.district || "-"}</td>
                          <td>
                            <span className={`sp-priority sp-priority--${req.priority}`}>
                              {req.priority === "urgent" ? "⚡ Urgent" : "Normal"}
                            </span>
                          </td>
                          <td className="sp-table-date">{formatDate(req.createdAt)}</td>
                          <td>
                            <span className="sp-status" style={{ background: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {!reqLoading && requests.length > 0 && (
              <p className="sp-table-note">
                Showing {requests.length} request{requests.length !== 1 ? "s" : ""}. Updates are reflected in real-time.
              </p>
            )}
          </section>

          {/* Right Sidebar */}
          <aside className="sp-sidebar">
            {/* Immediate Help */}
            <div className="sp-immediate-card">
              <div className="sp-immediate-card__header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.42 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6.29 6.29l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Need immediate help?
              </div>
              <p className="sp-immediate-card__desc">
                Our crisis hotline is available 24/7 for anyone feeling unsafe.
              </p>
              <a href="tel:119" className="sp-immediate-card__btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.42 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6.29 6.29l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call Police (119)
              </a>
            </div>

            {/* Victim Resources */}
            <div className="sp-resources-card">
              <h3 className="sp-resources-card__title">Victim Resources</h3>
              <div className="sp-resources-list">
                {visibleResources.map((res, i) => (
                  <a
                    key={i}
                    className="sp-resource-item sp-resource-item--link"
                    href={res.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sp-resource-item__icon">{res.icon}</span>
                    <div>
                      <p className="sp-resource-item__title">{res.title}</p>
                      <p className="sp-resource-item__meta">{res.meta}</p>
                    </div>
                  </a>
                ))}
              </div>
              <button
                className="sp-view-resources"
                onClick={() => setShowAllResources((prev) => !prev)}
                type="button"
              >
                {showAllResources ? "Show fewer resources" : "View all resources"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Request Modal ── */}
      {modalOpen && (
        <div className="sp-modal-overlay" onClick={closeModal}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sp-modal-close" onClick={closeModal} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {formSuccess ? (
              <div className="sp-modal-success">
                <div className="sp-modal-success__icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="sp-modal-success__title">Request Submitted!</h3>
                <p className="sp-modal-success__msg">
                  Your <strong>{formSuccess.serviceLabel}</strong> request has been received and is under review.
                </p>
                <div className="sp-modal-success__ticket">
                  <span>Your Ticket ID</span>
                  <strong>{formSuccess.ticketId}</strong>
                </div>
                <p className="sp-modal-success__note">
                  Our team will review your request and contact you within 24–48 hours.
                </p>
                <button className="sp-modal-success__btn" onClick={closeModal}>Done</button>
              </div>
            ) : (
              <>
                <div className="sp-modal-header">
                  {modalSvc && (
                    <div className="sp-modal-header__icon" style={{ background: modalSvc.iconBg, color: modalSvc.iconColor }}>
                      {modalSvc.icon}
                    </div>
                  )}
                  <div>
                    <h3 className="sp-modal-header__title">Request {modalSvc?.title}</h3>
                    <p className="sp-modal-header__sub">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      This request is confidential and encrypted
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="sp-modal-form">
                  <div className="sp-modal-field">
                    <label className="sp-modal-label">Priority Level</label>
                    <div className="sp-modal-radio-row">
                      <label className={`sp-modal-radio ${formPriority === "normal" ? "sp-modal-radio--active" : ""}`}>
                        <input type="radio" name="priority" value="normal" checked={formPriority === "normal"} onChange={() => setFormPriority("normal")} />
                        <span>Normal</span>
                      </label>
                      <label className={`sp-modal-radio sp-modal-radio--urgent ${formPriority === "urgent" ? "sp-modal-radio--active sp-modal-radio--urgent-active" : ""}`}>
                        <input type="radio" name="priority" value="urgent" checked={formPriority === "urgent"} onChange={() => setFormPriority("urgent")} />
                        <span>⚡ Urgent</span>
                      </label>
                    </div>
                  </div>
                  <div className="sp-modal-grid">
                    <div className="sp-modal-field">
                      <label className="sp-modal-label">Age <span className="sp-modal-required">*</span></label>
                      <input
                        className="sp-modal-input"
                        type="number"
                        min="0"
                        max="120"
                        value={formAge}
                        onChange={(e) => { setFormAge(e.target.value); setFormError(""); }}
                        placeholder="Enter age"
                      />
                    </div>
                    <div className="sp-modal-field">
                      <label className="sp-modal-label">Gender <span className="sp-modal-required">*</span></label>
                      <select
                        className="sp-modal-select"
                        value={formGender}
                        onChange={(e) => { setFormGender(e.target.value); setFormError(""); }}
                      >
                        {GENDER_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sp-modal-field">
                      <label className="sp-modal-label">Crime Type <span className="sp-modal-required">*</span></label>
                      <select
                        className="sp-modal-select"
                        value={formCrimeType}
                        onChange={(e) => { setFormCrimeType(e.target.value); setFormError(""); }}
                      >
                        <option value="">Select crime type</option>
                        {CRIME_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sp-modal-field">
                      <label className="sp-modal-label">District <span className="sp-modal-required">*</span></label>
                      <select
                        className="sp-modal-select"
                        value={formDistrict}
                        onChange={(e) => { setFormDistrict(e.target.value); setFormError(""); }}
                      >
                        <option value="">Select district</option>
                        {DISTRICT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="sp-modal-field">
                    <label className="sp-modal-label">
                      Description <span className="sp-modal-required">*</span>
                    </label>
                    <textarea
                      className="sp-modal-textarea"
                      rows={5}
                      value={formDesc}
                      onChange={(e) => { setFormDesc(e.target.value); setFormError(""); }}
                      placeholder={modalSvc?.placeholder || "Describe what you need help with…"}
                      maxLength={1000}
                    />
                    <span className="sp-modal-char">{formDesc.length}/1000</span>
                  </div>
                  {formError && (
                    <p className="sp-modal-error">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {formError}
                    </p>
                  )}
                  <div className="sp-modal-actions">
                    <button type="button" className="sp-modal-cancel" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="sp-modal-submit" disabled={formLoading}>
                      {formLoading ? (
                        <><span className="sp-spinner sp-spinner--sm" /> Submitting…</>
                      ) : (
                        <>
                          Submit Request
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <CitizenFooter />
    </div>
  );
}