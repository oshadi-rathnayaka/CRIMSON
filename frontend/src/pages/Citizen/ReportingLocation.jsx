import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/Citizen/ReportingLocation.css";

// Fix Leaflet default marker icon paths broken by bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [6.9271, 79.8612]; // Colombo [lat, lng]
const DEFAULT_ZOOM = 13;
const NOMINATIM = "https://nominatim.openstreetmap.org";

const ReportingLocation = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const category = state?.category || "incident";

  const mapRef        = useRef(null);   // DOM node
  const mapInstanceRef = useRef(null);  // Leaflet map instance
  const markerRef     = useRef(null);   // Leaflet marker instance

  const [selectedLocation, setSelectedLocation] = useState({
    address: "Colombo, Sri Lanka",
    coords: { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] },
    gpsAccurate: false,
  });
  const [gpsLoading,   setGpsLoading]   = useState(false);
  const [searchValue,  setSearchValue]  = useState("");
  const [suggestions,  setSuggestions]  = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef(null);

  /* ── Reverse geocode via Nominatim ── */
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res  = await fetch(
        `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "CRIMSON/1.0" } }
      );
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
      setSelectedLocation({ address: addr, coords: { lat, lng }, gpsAccurate: false });
      setSearchValue(addr);
    } catch {
      setSelectedLocation(prev => ({ ...prev, coords: { lat, lng } }));
    }
  }, []);

  /* ── Initialise Leaflet map (runs once) ── */
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(DEFAULT_CENTER, { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      reverseGeocode(lat, lng);
    });

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Initial reverse geocode for the default centre
    reverseGeocode(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [reverseGeocode]);

  /* ── Use Current Location ── */
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setGpsLoading(false);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
        try {
          const res  = await fetch(
            `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en", "User-Agent": "CRIMSON/1.0" } }
          );
          const data = await res.json();
          const addr = data.display_name || `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
          setSelectedLocation({ address: addr, coords: { lat, lng }, gpsAccurate: true });
          setSearchValue(addr);
        } catch {
          const addr = `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
          setSelectedLocation({ address: addr, coords: { lat, lng }, gpsAccurate: true });
          setSearchValue(addr);
        }
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ── Address Search (Nominatim) ── */
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    setSuggestions([]);
    clearTimeout(searchTimer.current);
    if (val.length < 3) return;
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(
          `${NOMINATIM}/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&countrycodes=lk&limit=5`,
          { headers: { "Accept-Language": "en", "User-Agent": "CRIMSON/1.0" } }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const addr = place.display_name;
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }
    setSelectedLocation({ address: addr, coords: { lat, lng }, gpsAccurate: false });
    setSearchValue(addr);
    setSuggestions([]);
  };

  /* ── Confirm navigation ── */
  const handleConfirm = () => {
    navigate("/report/evidence", {
      state: { category, location: selectedLocation },
    });
  };

  const coordLabel = selectedLocation.coords
    ? `${selectedLocation.coords.lat.toFixed(5)}° N, ${selectedLocation.coords.lng.toFixed(5)}° E`
    : "";

  return (
    <div className="rl-page">
      {/* ── Navbar ── */}
      <CitizenNavbar />

      {/* ── Main ── */}
      <main className="rl-main">
        <div className="rl-container">

          {/* Progress */}
          <div className="rl-progress-block">
            <div className="rl-progress-top">
              <span className="rl-progress-label">Step 2 of 4: Location Details</span>
              <span className="rl-progress-status">Reporting in progress</span>
            </div>
            <div className="rl-progress-bar">
              <div className="rl-progress-fill" style={{ width: "50%" }} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="rl-heading">Where did the incident happen?</h1>
          <p className="rl-subheading">
            Pinpoint the exact location on the map or enter the address manually.
            Accurate location data helps us respond faster.
          </p>

          {/* Map Card */}
          <div className="rl-map-card">
            {/* Top bar */}
            <div className="rl-map-topbar">
              <div className="rl-privacy-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e02020" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Location data is encrypted and only shared with verified officers.</span>
              </div>
              <button
                type="button"
                className="rl-gps-btn"
                onClick={handleUseCurrentLocation}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <span className="rl-spinner" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                  </svg>
                )}
                Use Current Location
              </button>
            </div>

            {/* Search */}
            <div className="rl-search-row">
              <div className="rl-search-box">
                <svg className="rl-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="rl-search-input"
                  placeholder="Search address, landmark, or city..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  autoComplete="off"
                />
                {searchLoading && <span className="rl-spinner rl-spinner--inline" />}
              </div>
              {suggestions.length > 0 && (
                <ul className="rl-suggestions">
                  {suggestions.map((s) => (
                    <li
                      key={s.place_id}
                      className="rl-suggestion-item"
                      onMouseDown={() => handleSelectSuggestion(s)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {s.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Map */}
            <div className="rl-map-wrapper">
              <div ref={mapRef} className="rl-map" />
            </div>

            {/* Selected Location Strip */}
            <div className="rl-location-strip">
              <div className="rl-location-strip__left">
                <span className="rl-location-strip__pin">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e02020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div className="rl-location-strip__info">
                  <span className="rl-location-strip__tag">SELECTED LOCATION</span>
                  <span className="rl-location-strip__address">{selectedLocation.address}</span>
                  <span className="rl-location-strip__coords">{coordLabel}</span>
                </div>
              </div>
              {selectedLocation.gpsAccurate && (
                <span className="rl-gps-badge">GPS ACCURATE</span>
              )}
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="rl-nav-actions">
            <button
              type="button"
              className="rl-back-btn"
              onClick={() => navigate("/report", { state: { category } })}
            >
              Back
            </button>
            <button type="button" className="rl-confirm-btn" onClick={handleConfirm}>
              Confirm Location &amp; Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

        </div>
      </main>

      <CitizenFooter />
    </div>
  );
};

export default ReportingLocation;