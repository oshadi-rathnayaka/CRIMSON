import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import "../../styles/Officer/EditProfile.css";

const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
];

export default function OfficerEditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    district: user?.district || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await api.put("/officer/auth/profile", {
        fullName: form.fullName,
        district: form.district,
      });
      updateUser(res.data?.user || {});
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="oep-page">
      <OfficerSidebar />

      <main className="oep-main">
        <h1 className="oep-title">Edit Profile</h1>

        <form className="oep-card" onSubmit={onSubmit}>
          <p className="oep-note">Only name and district are editable for officer accounts.</p>

          {error && <div className="oep-error">{error}</div>}
          {saved && <div className="oep-success">Profile updated successfully.</div>}

          <label className="oep-field">
            <span>Full Name</span>
            <input
              name="fullName"
              value={form.fullName}
              onChange={onChange}
              disabled={saving}
              autoComplete="name"
            />
          </label>

          <label className="oep-field">
            <span>District</span>
            <select name="district" value={form.district} onChange={onChange} disabled={saving}>
              <option value="">Select district</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label className="oep-field">
            <span>Email (not editable)</span>
            <input value={user?.email || ""} disabled readOnly />
          </label>

          <label className="oep-field">
            <span>Password (not editable)</span>
            <input type="password" value="********" disabled readOnly />
          </label>

          <div className="oep-actions">
            <button type="button" className="oep-btn oep-btn-ghost" onClick={() => navigate("/officer/profile")}>Cancel</button>
            <button type="submit" className="oep-btn" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
