import React, { useEffect, useState } from "react";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import { getContactContent, submitContactMessage } from "../../api/contact";
import "../../styles/Citizen/Contact.css";

const DEFAULT_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", district: "", subject: "", message: "",
  });
  const [title, setTitle] = useState("Contact Us");
  const [subtitle, setSubtitle] = useState("");
  const [districts, setDistricts] = useState(DEFAULT_DISTRICTS);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadContactContent = async () => {
      try {
        const response = await getContactContent();
        const data = response?.data?.data;

        if (data?.title) setTitle(data.title);
        if (data?.subtitle) setSubtitle(data.subtitle);
        if (Array.isArray(data?.districts) && data.districts.length > 0) {
          setDistricts(data.districts);
        }
      } catch (error) {
        setDistricts(DEFAULT_DISTRICTS);
      }
    };

    loadContactContent();
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (!form.district) e.district = "Please select a district.";
    if (!form.subject.trim()) e.subject = "Subject is required.";
    if (!form.message.trim()) e.message = "Message is required.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setSubmitting(true);
    setSubmitError("");

    try {
      await submitContactMessage(form);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error?.response?.data?.message || "Could not submit your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Navbar */}
      <CitizenNavbar />

      {/* Main */}
      <main className="contact-main">
        <h1 className="contact-title">{title}</h1>
        {subtitle && <p className="contact-subtitle">{subtitle}</p>}

        <div className="contact-card">
          {submitted ? (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2 className="success-heading">Message Sent!</h2>
              <p className="success-text">
                Thank you for reaching out. Our team will get back to you shortly.
              </p>
              <button
                className="btn-submit"
                onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", district: "", subject: "", message: "" }); }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <div className="contact-form">
              {submitError && <p className="contact-submit-error">{submitError}</p>}

              <Field label="Name" error={errors.name}>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className={`input-field${errors.name ? " input-error" : ""}`}
                />
              </Field>

              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`input-field${errors.email ? " input-error" : ""}`}
                />
              </Field>

              <Field label="Phone" error={errors.phone}>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className={`input-field${errors.phone ? " input-error" : ""}`}
                />
              </Field>

              <Field label="District" error={errors.district}>
                <div className="select-wrapper">
                  <select
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    className={`input-field select-field${errors.district ? " input-error" : ""}${!form.district ? " placeholder-select" : ""}`}
                  >
                    <option value="" disabled>Select your district</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="select-arrow">&#8964;</span>
                </div>
              </Field>

              <Field label="Subject" error={errors.subject}>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Enter a subject"
                  className={`input-field${errors.subject ? " input-error" : ""}`}
                />
              </Field>

              <Field label="Message" error={errors.message}>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Enter your message"
                  rows={6}
                  className={`input-field textarea-field${errors.message ? " input-error" : ""}`}
                />
              </Field>

              <div className="form-actions">
                <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <CitizenFooter />
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="form-field">
      <label className="field-label">{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}