import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/Setting.css";

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="toggle">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-slider" />
  </label>
);

const SelectField = ({ value, onChange, options }) => (
  <div className="select-wrapper">
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <span className="select-arrow">&#8964;</span>
  </div>
);

export default function Setting() {
  const { user } = useAuth();
  const { settings, updatePreferences, updateNotifications, updateAccessibility, saveSettings } = useSettings();
  const { preferences, notifications, accessibility } = settings;

  const [savedToast, setSavedToast] = useState(false);

  const toggleNotification = (key) =>
    updateNotifications({ [key]: !notifications[key] });

  const toggleAccessibility = (key) =>
    updateAccessibility({ [key]: !accessibility[key] });

  const handleSave = () => {
    saveSettings(settings);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="setting-page">
      {/* Navbar */}
      <CitizenNavbar />

      {/* Main Content */}
      <main className="setting-container">
        <h1 className="setting-title">Setting</h1>

        {savedToast && (
          <div className="setting-saved-toast">Settings saved successfully!</div>
        )}

        {/* Preferences */}
        <section className="setting-section">
          <h2 className="section-heading">Preferences</h2>
          <div className="setting-card">
            <SettingRow
              label="Theme"
              description="Choose the visual theme for your portal."
            >
              <SelectField
                value={preferences.theme}
                onChange={(v) => updatePreferences({ theme: v })}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                  { value: "system", label: "System" },
                ]}
              />
            </SettingRow>
            <SettingRow
              label="Date Format"
              description="Set the format for dates displayed in the portal."
            >
              <SelectField
                value={preferences.dateFormat}
                onChange={(v) => updatePreferences({ dateFormat: v })}
                options={[
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                ]}
              />
            </SettingRow>
            <SettingRow
              label="Time Format"
              description="Set the format for times displayed in the portal."
              last
            >
              <SelectField
                value={preferences.timeFormat}
                onChange={(v) => updatePreferences({ timeFormat: v })}
                options={[
                  { value: "24hour", label: "24 hour time" },
                  { value: "12hour", label: "12 hour time" },
                ]}
              />
            </SettingRow>
          </div>
        </section>

        {/* Notifications */}
        <section className="setting-section">
          <h2 className="section-heading">Notifications</h2>
          <div className="setting-card">
            <SettingRow
              label="Case Status Updates"
              description="Receive updates on the status of your reported cases."
            >
              <ToggleSwitch
                checked={notifications.caseStatus}
                onChange={() => toggleNotification("caseStatus")}
              />
            </SettingRow>
            <SettingRow
              label="Support Request Updates"
              description="Get notified about updates to your support requests."
            >
              <ToggleSwitch
                checked={notifications.supportRequest}
                onChange={() => toggleNotification("supportRequest")}
              />
            </SettingRow>
            <SettingRow
              label="Emergency Alerts"
              description="Receive critical alerts and notifications."
            >
              <ToggleSwitch
                checked={notifications.emergencyAlerts}
                onChange={() => toggleNotification("emergencyAlerts")}
              />
            </SettingRow>
            <SettingRow
              label="Email Notifications"
              description="Receive notifications via email."
            >
              <ToggleSwitch
                checked={notifications.emailNotifications}
                onChange={() => toggleNotification("emailNotifications")}
              />
            </SettingRow>
            <SettingRow
              label="SMS Notifications"
              description="Receive notifications via SMS."
              last
            >
              <ToggleSwitch
                checked={notifications.smsNotifications}
                onChange={() => toggleNotification("smsNotifications")}
              />
            </SettingRow>
          </div>
        </section>

        {/* Accessibility */}
        <section className="setting-section">
          <h2 className="section-heading">Accessibility</h2>
          <div className="setting-card">
            <SettingRow
              label="Text Size"
              description="Adjust the size of text displayed in the portal."
            >
              <div className="slider-wrapper">
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={accessibility.textSize}
                  onChange={(e) =>
                    updateAccessibility({ textSize: Number(e.target.value) })
                  }
                  className="range-slider"
                  style={{
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((accessibility.textSize - 10) / 90) * 100}%, var(--border) ${((accessibility.textSize - 10) / 90) * 100}%, var(--border) 100%)`
                  }}
                />
                <span className="slider-value">{accessibility.textSize}</span>
              </div>
            </SettingRow>
            <SettingRow
              label="High Contrast Mode"
              description="Enable high contrast mode for improved visibility."
            >
              <ToggleSwitch
                checked={accessibility.highContrast}
                onChange={() => toggleAccessibility("highContrast")}
              />
            </SettingRow>
            <SettingRow
              label="Screen Reader Compatibility"
              description="Enable screen reader compatibility for accessibility."
              last
            >
              <ToggleSwitch
                checked={accessibility.screenReader}
                onChange={() => toggleAccessibility("screenReader")}
              />
            </SettingRow>
          </div>
        </section>

        <div className="setting-save-row">
          <button className="setting-save-btn" onClick={handleSave}>Save Settings</button>
        </div>
      </main>

      <CitizenFooter />
    </div>
  );
}

function SettingRow({ label, description, children, last }) {
  return (
    <div className={`setting-row${last ? " last" : ""}`}>
      <div className="setting-row-info">
        <span className="setting-row-label">{label}</span>
        <span className="setting-row-desc">{description}</span>
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}