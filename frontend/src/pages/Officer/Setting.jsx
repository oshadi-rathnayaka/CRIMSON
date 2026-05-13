import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import "../../styles/Officer/Setting.css";

export default function OfficerSetting() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    language: user?.settings?.preferences?.language || "english",
    theme: user?.settings?.preferences?.theme || "light",
    dateFormat: user?.settings?.preferences?.dateFormat || "DD/MM/YYYY",
    timeFormat: user?.settings?.preferences?.timeFormat || "24hour",
  });

  // Load latest settings from backend on mount
  useEffect(() => {
    api.get("/officer/auth/me")
      .then((res) => {
        if (res.data?.user) updateUser(res.data.user);
        const s = res.data?.user?.settings?.preferences;
        if (s) setForm({
          language:   s.language   || "english",
          theme:      s.theme      || "light",
          dateFormat: s.dateFormat || "DD/MM/YYYY",
          timeFormat: s.timeFormat || "24hour",
        });
      })
      .catch(() => {});
  }, []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Live-apply theme immediately when user changes the dropdown
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', form.theme === 'dark' ? 'dark' : 'light');
  }, [form.theme]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
    setError("");
  };

  const onSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put("/officer/auth/settings", {
        preferences: {
          language: form.language,
          theme: form.theme,
          dateFormat: form.dateFormat,
          timeFormat: form.timeFormat,
        },
      });
      updateUser({ settings: res.data?.settings || user?.settings });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ops-page">
      <OfficerSidebar />

      <main className="ops-main">
        <h1 className="ops-title">Setting</h1>

        <form className="ops-card" onSubmit={onSave}>
          <p className="ops-note">Officer email and password are managed by admin and cannot be edited.</p>

          {error && <div className="ops-error">{error}</div>}
          {saved && <div className="ops-success">Settings saved.</div>}

          <label className="ops-field">
            <span>Language</span>
            <select name="language" value={form.language} onChange={onChange} disabled={saving}>
              <option value="english">English</option>
              <option value="sinhala">Sinhala</option>
              <option value="tamil">Tamil</option>
            </select>
          </label>

          <label className="ops-field">
            <span>Theme</span>
            <select name="theme" value={form.theme} onChange={onChange} disabled={saving}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label className="ops-field">
            <span>Date Format</span>
            <select name="dateFormat" value={form.dateFormat} onChange={onChange} disabled={saving}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </label>

          <label className="ops-field">
            <span>Time Format</span>
            <select name="timeFormat" value={form.timeFormat} onChange={onChange} disabled={saving}>
              <option value="24hour">24-Hour</option>
              <option value="12hour">12-Hour</option>
            </select>
          </label>

          <label className="ops-field">
            <span>Email (not editable)</span>
            <input value={user?.email || ""} disabled readOnly />
          </label>

          <label className="ops-field">
            <span>Password (not editable)</span>
            <input type="password" value="********" disabled readOnly />
          </label>

          <div className="ops-actions">
            <button type="button" className="ops-btn ops-btn-ghost" onClick={() => navigate("/officer/profile")}>Back</button>
            <button type="submit" className="ops-btn" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
