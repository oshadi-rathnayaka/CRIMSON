import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoImage from "../../assets/Logo.png";
import "../../styles/Citizen/Register.css";

const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
];

const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#e02020" };
  if (score <= 3) return { score, label: "Fair", color: "#f59e0b" };
  return { score, label: "Strong", color: "#16a34a" };
};

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error: authError, clearError } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    nationalId: "",
    district: "",
    mobileCountry: "+94",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreePolicy: false,
    agreeNotifications: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = getPasswordStrength(form.password);
  const busy = isSubmitting || loading;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    clearError();
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (errors.submit) setErrors((prev) => ({ ...prev, submit: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!form.nationalId.trim()) newErrors.nationalId = "National ID or Passport is required.";
    if (!form.district) newErrors.district = "Please select a district.";
    if (!form.mobile.trim()) newErrors.mobile = "Mobile number is required.";
    if (!form.email.trim()) newErrors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Enter a valid email.";
    if (!form.password) newErrors.password = "Password is required.";
    else if (form.password.length < 8) newErrors.password = "Min 8 chars, mixed case & numbers.";
    if (!form.confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    if (!form.agreePolicy) newErrors.agreePolicy = "You must agree to the Privacy Policy & Terms of Use.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const normalizedPhone = form.mobile.trim().replace(/\s+/g, "");
    const result = await register({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      phone: normalizedPhone,
      district: form.district,
      nationalId: form.nationalId.trim(),
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setErrors((prev) => ({ ...prev, submit: result.error || "Registration failed." }));
    }
  };

  return (
    <div className="reg-page">
      {/* Navbar */}
      <nav className="reg-nav">
        <Link to="/" className="reg-nav__brand" style={{ textDecoration: "none" }}>
          <img src={logoImage} alt="CRIMSON logo" className="reg-nav__logo-icon" />
          <span className="reg-nav__brand-name">CRIMSON</span>
        </Link>
        <Link to="/login" className="reg-nav__signin-btn">Sign in</Link>
      </nav>

      {/* Main */}
      <main className="reg-main">
        {/* Left Panel */}
        <section className="reg-left">
          <div className="reg-form-wrapper">
            <div className="reg-header">
              <h1 className="reg-title">Welcome to CRIMSON</h1>
              <p className="reg-subtitle">
                Secure Crime Reporting &amp; Victim Support Portal. Your identity is protected.
              </p>
            </div>

            {/* Form */}
            <form className="reg-form" onSubmit={handleSubmit} noValidate>
              {(authError || errors.submit) && (
                <div className="reg-alert reg-alert--error">
                  {authError || errors.submit}
                </div>
              )}

              {/* Full Name */}
              <div className="reg-field">
                <label className="reg-label" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className={`reg-input ${errors.fullName ? "reg-input--error" : ""}`}
                  placeholder="Enter your full legal name"
                  value={form.fullName}
                  onChange={handleChange}
                  disabled={busy}
                  autoComplete="name"
                />
                {errors.fullName && <span className="reg-error">{errors.fullName}</span>}
              </div>

              {/* National ID + District */}
              <div className="reg-row">
                <div className="reg-field">
                  <label className="reg-label" htmlFor="nationalId">National ID / Passport</label>
                  <input
                    id="nationalId"
                    name="nationalId"
                    type="text"
                    className={`reg-input ${errors.nationalId ? "reg-input--error" : ""}`}
                    placeholder="NIC or Passport No."
                    value={form.nationalId}
                    onChange={handleChange}
                    disabled={busy}
                  />
                  {errors.nationalId && <span className="reg-error">{errors.nationalId}</span>}
                </div>
                <div className="reg-field">
                  <label className="reg-label" htmlFor="district">District/Province</label>
                  <select
                    id="district"
                    name="district"
                    className={`reg-select ${errors.district ? "reg-input--error" : ""}`}
                    value={form.district}
                    onChange={handleChange}
                    disabled={busy}
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.district && <span className="reg-error">{errors.district}</span>}
                </div>
              </div>

              {/* Mobile */}
              <div className="reg-field">
                <label className="reg-label" htmlFor="mobile">Mobile Number</label>
                <div className="reg-mobile-group">
                  <select
                    name="mobileCountry"
                    className="reg-country-code"
                    value={form.mobileCountry}
                    onChange={handleChange}
                    disabled={busy}
                    aria-label="Country code"
                  >
                    <option value="+94">+94</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+61">+61</option>
                    <option value="+91">+91</option>
                  </select>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    className={`reg-input reg-mobile-input ${errors.mobile ? "reg-input--error" : ""}`}
                    placeholder="7X XXX XXXX"
                    value={form.mobile}
                    onChange={handleChange}
                    disabled={busy}
                    autoComplete="tel"
                  />
                </div>
                {errors.mobile && <span className="reg-error">{errors.mobile}</span>}
              </div>

              {/* Email */}
              <div className="reg-field">
                <label className="reg-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`reg-input ${errors.email ? "reg-input--error" : ""}`}
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={busy}
                  autoComplete="email"
                />
                {errors.email && <span className="reg-error">{errors.email}</span>}
              </div>

              {/* Password + Confirm */}
              <div className="reg-row">
                <div className="reg-field">
                  <label className="reg-label" htmlFor="password">Create Password</label>
                  <div className="reg-input-wrapper">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={`reg-input reg-input--pw ${errors.password ? "reg-input--error" : ""}`}
                      value={form.password}
                      onChange={handleChange}
                      disabled={busy}
                      autoComplete="new-password"
                    />
                    <button type="button" className="reg-toggle-pw" onClick={() => setShowPassword(v => !v)} tabIndex={-1} disabled={busy}>
                      {showPassword
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password && (
                    <div className="reg-strength">
                      <div className="reg-strength__bars">
                        {[1,2,3,4,5].map(i => (
                          <div
                            key={i}
                            className="reg-strength__bar"
                            style={{ background: i <= strength.score ? strength.color : "#e5e7eb" }}
                          />
                        ))}
                      </div>
                      <span className="reg-strength__label" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                  )}
                  {!form.password && <span className="reg-hint">Min 8 chars, mixed case &amp; numbers</span>}
                  {errors.password && <span className="reg-error">{errors.password}</span>}
                </div>

                <div className="reg-field">
                  <label className="reg-label" htmlFor="confirmPassword">Confirm Password</label>
                  <div className="reg-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      className={`reg-input reg-input--pw ${errors.confirmPassword ? "reg-input--error" : ""}`}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      disabled={busy}
                      autoComplete="new-password"
                    />
                    <button type="button" className="reg-toggle-pw" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} disabled={busy}>
                      {showConfirm
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="reg-error">{errors.confirmPassword}</span>}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="reg-checks">
                <label className="reg-check-row">
                  <input
                    type="checkbox"
                    name="agreePolicy"
                    className="reg-checkbox"
                    checked={form.agreePolicy}
                    onChange={handleChange}
                    disabled={busy}
                  />
                  <span className="reg-check-label">
                    I agree to the{" "}
                    <Link to="/privacy-policy" className="reg-link">Privacy Policy</Link>
                    {" "}&amp;{" "}
                    <Link to="/terms" className="reg-link">Terms of Use</Link>.
                  </span>
                </label>
                {errors.agreePolicy && <span className="reg-error reg-error--check">{errors.agreePolicy}</span>}

                <label className="reg-check-row">
                  <input
                    type="checkbox"
                    name="agreeNotifications"
                    className="reg-checkbox reg-checkbox--checked"
                    checked={form.agreeNotifications}
                    onChange={handleChange}
                    disabled={busy}
                  />
                  <span className="reg-check-label">
                    I consent to receive notifications about my reports via SMS/Email.
                  </span>
                </label>
              </div>

              <button type="submit" className="reg-btn" disabled={busy}>
                {busy ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </div>

          <footer className="reg-footer">
            <Link to="/help" className="reg-footer-link">Help Center</Link>
            <Link to="/victim-support" className="reg-footer-link">Victim Support</Link>
            <Link to="/officer/login" className="reg-footer-link">Officer Login</Link>
          </footer>
        </section>

        {/* Right Panel */}
        <section className="reg-right">
          <div className="emergency-section">
            <div className="emergency-box">
              <p className="emergency-title">⚠️ Emergency?</p>
              <p className="emergency-text">
                If you are in immediate danger, do not use this portal. Call emergency services immediately.
              </p>
              <a href="tel:119" className="call-button">
                Call 119 <span className="phone-icon">📞</span>
              </a>
            </div>
          </div>

          <div className="slogan-area">
            <div className="slogan-divider"></div>
            <h2 className="slogan-main">Safer Communities</h2>
            <h3 className="slogan-sub">Through Technology &amp; Transparency</h3>
            <p className="slogan-desc">
              CRIMSON uses advanced AI and analytics to prioritize citizen safety, offering secure reporting and seamless victim support across Sri Lanka.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Register;