import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { activateSOS, cancelSOS } from "../../api/sos";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/SOS.css";

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "CRIMSON-SOS/1.0" },
    });
    if (!res.ok) throw new Error("Nominatim error");
    const data = await res.json();
    const addr = data.address || {};
    const district =
      addr.county || addr.state_district || addr.state || "Unknown District";
    const city   = addr.city || addr.town || addr.village || addr.suburb || "";
    const road   = addr.road || addr.neighbourhood || "";
    const parts  = [road, city, district, "Sri Lanka"].filter(Boolean);
    // deduplicate consecutive same values
    const address = parts.filter((v, i) => v !== parts[i - 1]).join(", ");
    return { district, address };
  } catch {
    return { district: "Unknown District", address: null };
  }
}

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SOS() {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [phase,       setPhase]       = useState("locating");
  const [caseId,      setCaseId]      = useState(null);
  const [coords,      setCoords]      = useState(null);
  const [district,    setDistrict]    = useState("Unknown District");
  const [address,     setAddress]     = useState("Detecting location…");
  const [elapsed,     setElapsed]     = useState(0);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [cancelling,  setCancelling]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const timerRef   = useRef(null);
  const caseIdRef  = useRef(null);

  const activateWithLocation = useCallback(async (loc) => {
    setPhase("activating");
    try {
      const res  = await activateSOS({
        latitude:  loc?.lat    || null,
        longitude: loc?.lng    || null,
        address:   loc?.address || (loc ? `${loc.lat.toFixed(5)}°N ${loc.lng.toFixed(5)}°E` : "Unknown"),
        district:  loc?.district || "Unknown",
      });
      const data = res.data?.data;
      setCaseId(data.caseId);
      caseIdRef.current = data.caseId;
      if (!loc) { setAddress("Location unavailable"); setDistrict("Unknown District"); }
      setPhase("active");
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Failed to activate SOS. Please call 119 immediately.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { activateWithLocation(null); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        // Show coordinates immediately while geocoding runs
        setAddress(`${lat.toFixed(5)}°N  ${lng.toFixed(5)}°E`);
        // Real reverse geocoding via OpenStreetMap Nominatim
        const geo = await reverseGeocode(lat, lng);
        const detectedAddress  = geo.address || `${lat.toFixed(5)}°N  ${lng.toFixed(5)}°E`;
        const detectedDistrict = geo.district;
        setAddress(detectedAddress);
        setDistrict(detectedDistrict);
        activateWithLocation({ lat, lng, address: detectedAddress, district: detectedDistrict });
      },
      () => activateWithLocation(null),
      { timeout: 8000, maximumAge: 0 }
    );
  }, [activateWithLocation]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleCancel = async () => {
    if (!caseIdRef.current || cancelling) return;
    setCancelling(true);
    try {
      await cancelSOS(caseIdRef.current);
      clearInterval(timerRef.current);
      setPhase("cancelled");
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Cancel failed. Please try again.");
    } finally {
      setCancelling(false);
      setShowConfirm(false);
    }
  };

  const renderSteps = () => (
    <div className="sos-steps">
      {/* Step 1 – Location */}
      <div className={`sos-step ${phase !== "locating" ? "sos-step--done" : "sos-step--active"}`}>
        <div className="sos-step__icon">
          {phase === "locating" ? <span className="sos-spinner" /> : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          )}
        </div>
        <div className="sos-step__body">
          <span className="sos-step__label">Location {phase === "locating" ? "detecting…" : "detected"}</span>
          {phase !== "locating" && <span className="sos-step__sub">{address}</span>}
        </div>
      </div>

      {/* Step 2 – Alert sent */}
      <div className={`sos-step ${
        phase === "activating" ? "sos-step--active" :
        phase === "active" || phase === "cancelled" ? "sos-step--done" : "sos-step--pending"}`}>
        <div className="sos-step__icon">
          {phase === "activating" ? <span className="sos-spinner" /> :
           phase === "active" || phase === "cancelled" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
           ) : <span className="sos-step__num">2</span>}
        </div>
        <div className="sos-step__body">
          <span className="sos-step__label">
            {phase === "activating" ? "Alerting police…" :
             phase === "active" || phase === "cancelled" ? "Alert sent to police" : "Alert police"}
          </span>
          {(phase === "active" || phase === "cancelled") && (
            <span className="sos-step__sub">{district}</span>
          )}
        </div>
      </div>

      {/* Step 3 – Officers */}
      <div className={`sos-step ${
        phase === "active" ? "sos-step--responding" :
        phase === "cancelled" ? "sos-step--cancelled" : "sos-step--pending"}`}>
        <div className="sos-step__icon">
          {phase === "active" ? <span className="sos-pulse-dot" /> :
           phase === "cancelled" ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
           ) : <span className="sos-step__num">3</span>}
        </div>
        <div className="sos-step__body">
          <span className="sos-step__label">
            {phase === "active" ? "Officers responding" :
             phase === "cancelled" ? "Emergency cancelled" : "Officers respond"}
          </span>
          {phase === "active" && <span className="sos-step__sub">Nearest patrol unit dispatched · ETA 3–5 min</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="sos-page">

      {/* ── Navbar ── */}
      <CitizenNavbar />

      {/* ── Content ── */}
      <main className="sos-main">

        {/* ERROR */}
        {phase === "error" && (
          <div className="sos-card sos-card--error">
            <div className="sos-badge sos-badge--error">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="sos-card__title">Activation Failed</h2>
            <p className="sos-card__desc">{errorMsg}</p>
            <a href="tel:119" className="sos-call-btn">📞 Call 119 Now</a>
            <button className="sos-back-btn" onClick={() => navigate("/dashboard")}>Return to Dashboard</button>
          </div>
        )}

        {/* LOCATING / ACTIVATING / ACTIVE */}
        {(phase === "locating" || phase === "activating" || phase === "active") && (
          <div className="sos-card">
            <div className="sos-card__header">
              <div className={`sos-badge ${phase === "active" ? "sos-badge--active" : "sos-badge--loading"}`}>
                {phase === "active" ? (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                ) : <span className="sos-spinner sos-spinner--lg" />}
              </div>
              <h1 className="sos-card__title">
                {phase === "locating" && "Detecting Location…"}
                {phase === "activating" && "Activating SOS…"}
                {phase === "active" && "Emergency SOS Activated"}
              </h1>
              {phase === "active" && (
                <p className="sos-card__desc">
                  Your location is being shared with the nearest police station&nbsp;
                  <strong>({district})</strong>
                </p>
              )}
            </div>

            {renderSteps()}

            {phase === "active" && caseId && (
              <div className="sos-info-grid">
                <div className="sos-info-cell">
                  <span className="sos-info-cell__label">CASE ID</span>
                  <span className="sos-info-cell__value">{caseId}</span>
                </div>
                <div className="sos-info-cell">
                  <span className="sos-info-cell__label">TIME ELAPSED</span>
                  <span className="sos-info-cell__value sos-timer">{formatElapsed(elapsed)}</span>
                </div>
                <div className="sos-info-cell">
                  <span className="sos-info-cell__label">COORDINATES</span>
                  <span className="sos-info-cell__value">{coords ? `${coords.lat.toFixed(4)}°N · ${coords.lng.toFixed(4)}°E` : "Unavailable"}</span>
                </div>
                <div className="sos-info-cell">
                  <span className="sos-info-cell__label">DISTRICT</span>
                  <span className="sos-info-cell__value">{district}</span>
                </div>
              </div>
            )}

            {phase === "active" && (
              <div className="sos-live-banner">
                <span className="sos-live-dot" /> Live location updates being sent every 30 seconds
              </div>
            )}

            {phase === "active" && (
              <div className="sos-notice">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>Stay in a safe place and keep your phone unlocked. Officers may call you.</p>
              </div>
            )}

            {phase === "active" && (
              <div className="sos-actions">
                <button className="sos-cancel-btn" onClick={() => setShowConfirm(true)}>
                  Cancel Emergency
                </button>
              </div>
            )}
          </div>
        )}

        {/* CANCELLED */}
        {phase === "cancelled" && (
          <div className="sos-card sos-card--cancelled">
            <div className="sos-badge sos-badge--cancelled">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="sos-card__title">Emergency Cancelled</h2>
            <p className="sos-card__desc">
              Your SOS alert has been cancelled.<br />
              Case <strong>{caseId}</strong> is now closed.
            </p>
            <p className="sos-card__desc" style={{ marginTop: 6, fontSize: "0.82rem", color: "#6b7280" }}>
              If you still need help, call <strong>119</strong> immediately.
            </p>
            <button className="sos-back-btn" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </button>
          </div>
        )}

        {/* Emergency strip */}
        <div className="sos-emergency-strip">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19 19.48 19.48 0 0 1 5 12.61 19.79 19.79 0 0 1 3 3.18 2 2 0 0 1 5 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 23 16z"/>
          </svg>
          Emergency? Call &nbsp;<a href="tel:119"><strong>119</strong></a>&nbsp; immediately
        </div>
      </main>

      {/* ── Cancel Confirm Modal ── */}
      {showConfirm && (
        <div className="sos-overlay" onClick={() => setShowConfirm(false)}>
          <div className="sos-modal" onClick={e => e.stopPropagation()}>
            <h3>Cancel Emergency?</h3>
            <p>Only cancel if you are safe. Are you sure?</p>
            <div className="sos-modal__btns">
              <button className="sos-modal__keep" onClick={() => setShowConfirm(false)}>Keep Active</button>
              <button className="sos-modal__confirm" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CitizenFooter />
    </div>
  );
}