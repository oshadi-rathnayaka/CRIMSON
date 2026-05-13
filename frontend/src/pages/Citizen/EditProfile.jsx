import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/EditProfile.css";

const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
];

const LANGUAGES = ["English", "Sinhala", "Tamil"];

const normalizePhoneForEdit = (value) => String(value || "").replace(/^\+94/, "").replace(/\s+/g, "");

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: normalizePhoneForEdit(user?.phone),
    district: user?.district || "Colombo",
    nationalId: user?.nationalId || "",
    language: user?.language || "English",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setSaved(false);
    setServerError("");
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    if (!form.district) errs.district = "Please select a district.";
    if (!form.nationalId.trim()) errs.nationalId = "National ID is required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setServerError("");
    try {
      const res = await api.put("/auth/profile", {
        fullName: form.fullName,
        phone: normalizePhoneForEdit(form.phone),
        district: form.district,
        nationalId: form.nationalId,
        language: form.language,
      });
      updateUser(res.data.user);
      setSaved(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save changes.";
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ep-page">
      {/* ── Navbar ── */}
      <CitizenNavbar />

      {/* ── Main ── */}
      <main className="ep-main">
        <h1 className="ep-page-title">Edit Profile</h1>

        <div className="ep-card">
          <form className="ep-form" onSubmit={handleSubmit} noValidate>

            {serverError && (
              <div className="ep-server-error">{serverError}</div>
            )}

            {/* Full Name */}
            <div className="ep-field">
              <label className="ep-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className={`ep-input${errors.fullName ? " ep-input--error" : ""}`}
                value={form.fullName}
                onChange={handleChange}
                disabled={saving}
                autoComplete="name"
              />
              {errors.fullName && <span className="ep-error">{errors.fullName}</span>}
            </div>

            {/* Email */}
            <div className="ep-field">
              <label className="ep-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`ep-input${errors.email ? " ep-input--error" : ""}`}
                value={form.email}
                onChange={handleChange}
                disabled={saving}
                autoComplete="email"
              />
              {errors.email && <span className="ep-error">{errors.email}</span>}
            </div>

            {/* Phone */}
            <div className="ep-field">
              <label className="ep-label" htmlFor="phone">Phone Number</label>
              <div className={`ep-phone-wrap${errors.phone ? " ep-input--error" : ""}`}>
                <span className="ep-phone-code">+94</span>
                <div className="ep-phone-divider" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="ep-phone-input"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={saving}
                  autoComplete="tel"
                  placeholder="712345678"
                />
              </div>
              {errors.phone && <span className="ep-error">{errors.phone}</span>}
            </div>

            {/* Residential District */}
            <div className="ep-field">
              <label className="ep-label" htmlFor="district">Residential District</label>
              <div className="ep-select-wrap">
                <select
                  id="district"
                  name="district"
                  className={`ep-select${errors.district ? " ep-input--error" : ""}`}
                  value={form.district}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {errors.district && <span className="ep-error">{errors.district}</span>}
            </div>

            {/* National ID */}
            <div className="ep-field">
              <label className="ep-label" htmlFor="nationalId">National ID (NIC)</label>
              <input
                id="nationalId"
                name="nationalId"
                type="text"
                className={`ep-input${errors.nationalId ? " ep-input--error" : ""}`}
                value={form.nationalId}
                onChange={handleChange}
                disabled={saving}
              />
              {errors.nationalId && <span className="ep-error">{errors.nationalId}</span>}
            </div>

            {/* Preferred Language */}
            <div className="ep-field">
              <label className="ep-label" htmlFor="language">Preferred Language</label>
              <div className="ep-select-wrap">
                <select
                  id="language"
                  name="language"
                  className="ep-select"
                  value={form.language}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="ep-actions">
              {saved && (
                <span className="ep-saved-msg">
                  ✓ Changes saved successfully
                </span>
              )}
              <button type="submit" className="ep-save-btn" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </form>
        </div>
      </main>

      <CitizenFooter />
    </div>
  );
}