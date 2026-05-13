import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Admin/Permissions.css";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import {
  fetchPermissionsMatrix,
  resetPermissionsMatrix,
  savePermissionsMatrix,
} from "../../api/permissions";

const ROLES = ["citizen", "officer", "admin"];

const ROLE_META = {
  citizen: {
    label: "Citizen",
    tag: "EXTERNAL",
    tagClass: "tag--external",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    description: "Public reporting, emergency alerts, and tracking personal case status.",
  },
  officer: {
    label: "Police Officer",
    tag: "INTERNAL",
    tagClass: "tag--internal",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    description: "Investigation management, evidence logging, and daily field reporting.",
  },
  admin: {
    label: "Administrator",
    tag: "SYSTEM",
    tagClass: "tag--system",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93A10 10 0 1 0 4.93 19.07 10 10 0 0 0 19.07 4.93z" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
    description: "Full system configuration, user auditing, and high-level data management.",
  },
};

const PERMISSIONS = [
  {
    id: "viewPublicReports",
    label: "View Public Reports",
    description: "Access to non-sensitive crime statistics and community bulletins.",
    defaults: { citizen: true, officer: true, admin: true },
  },
  {
    id: "editUpdateCases",
    label: "Edit & Update Cases",
    description: "Modify active investigation files, append evidence, and update status.",
    defaults: { citizen: false, officer: true, admin: true },
  },
  {
    id: "accessCrimeAnalytics",
    label: "Access Crime Analytics",
    description: "View AI-driven heatmaps, predictive trends, and demographic data.",
    defaults: { citizen: false, officer: true, admin: true },
  },
  {
    id: "exportSystemData",
    label: "Export System Data",
    description: "Download case files as PDF or bulk data as CSV/XLSX formats.",
    defaults: { citizen: false, officer: false, admin: true },
  },
  {
    id: "manageSystemUsers",
    label: "Manage System Users",
    description: "Create accounts, deactivate personnel, and assign role hierarchies.",
    defaults: { citizen: false, officer: false, admin: true },
  },
  {
    id: "viewAuditLogs",
    label: "View Audit Logs",
    description: "Track all system interactions and changes made by various roles.",
    defaults: { citizen: false, officer: false, admin: true },
  },
];

function buildDefaultMatrix() {
  const matrix = {};
  PERMISSIONS.forEach((p) => {
    matrix[p.id] = { ...p.defaults };
  });
  return matrix;
}

export default function Permissions() {
  const navigate = useNavigate();
  const [matrix, setMatrix] = useState(buildDefaultMatrix());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeRole, setActiveRole] = useState("officer");

  const handleAdminAuthFailure = (err, fallbackMessage) => {
    const statusCode = err?.response?.status;

    if (statusCode === 401 || statusCode === 403) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setError(fallbackMessage);
  };

  useEffect(() => {
    const loadMatrix = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchPermissionsMatrix();
        const remoteMatrix = res.data?.data?.matrix;
        if (remoteMatrix && typeof remoteMatrix === "object") {
          setMatrix(remoteMatrix);
        }
      } catch (err) {
        handleAdminAuthFailure(err, "Failed to load permissions from server.");
      } finally {
        setLoading(false);
      }
    };

    loadMatrix();
  }, []);

  const toggle = (permId, role) => {
    setMatrix((prev) => ({
      ...prev,
      [permId]: { ...prev[permId], [role]: !prev[permId][role] },
    }));
    setSaved(false);
  };

  const handleReset = () => {
    const resetMatrix = async () => {
      setSaving(true);
      setError("");
      try {
        const res = await resetPermissionsMatrix();
        const serverMatrix = res.data?.data?.matrix;
        setMatrix(serverMatrix || buildDefaultMatrix());
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        handleAdminAuthFailure(err, "Failed to reset permissions.");
      } finally {
        setSaving(false);
      }
    };

    resetMatrix();
  };

  const handleSave = () => {
    const saveMatrix = async () => {
      setSaving(true);
      setError("");
      try {
        const res = await savePermissionsMatrix(matrix);
        const serverMatrix = res.data?.data?.matrix;
        if (serverMatrix && typeof serverMatrix === "object") {
          setMatrix(serverMatrix);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        handleAdminAuthFailure(err, "Failed to save permissions.");
      } finally {
        setSaving(false);
      }
    };

    saveMatrix();
  };

  return (
    <div className="permissions-page admin-with-sidebar">
      <AdminSidebar />
      {/* Header */}
      <div className="permissions-header">
        <div className="permissions-header__meta">
          <span className="permissions-header__eyebrow">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            ADMIN CONTROL PANEL
          </span>
          <h1 className="permissions-header__title">Role-Based Access Control</h1>
          <p className="permissions-header__subtitle">
            Configure system-wide functional permissions for CRIMSON users across Sri Lanka Police departments.
          </p>
        </div>
        <div className="permissions-header__actions">
          <button className="btn btn--ghost" onClick={handleReset} disabled={saving || loading}>
            Reset Defaults
          </button>
          <button className={`btn btn--primary ${saved ? "btn--saved" : ""}`} onClick={handleSave} disabled={saving || loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {saving ? "Saving..." : saved ? "Saved!" : "Save Permissions"}
          </button>
        </div>
      </div>

      {error && (
        <div className="notice" style={{ marginBottom: 16 }}>
          <div>
            <strong>Could not update permissions</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Role Cards */}
      <div className="role-cards">
        {ROLES.map((role) => {
          const meta = ROLE_META[role];
          return (
            <div
              key={role}
              className={`role-card ${activeRole === role ? "role-card--active" : ""}`}
              onClick={() => setActiveRole(role)}
            >
              <div className="role-card__top">
                <div className="role-card__icon">{meta.icon}</div>
                <span className={`tag ${meta.tagClass}`}>{meta.tag}</span>
              </div>
              <h3 className="role-card__name">{meta.label}</h3>
              <p className="role-card__desc">{meta.description}</p>
            </div>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <div className="matrix-section">
        <h2 className="matrix-title">Permission Matrix</h2>
        <div className="matrix-legend">
          <span className="legend-item">
            <span className="legend-dot legend-dot--full" />
            Full Access
          </span>
          <span className="legend-item">
            <span className="legend-dot legend-dot--none" />
            No Access
          </span>
        </div>

        <div className="matrix-table">
          <div className="matrix-table__head">
            <div className="matrix-table__cell matrix-table__cell--module">Functional Module</div>
            {ROLES.map((role) => (
              <div key={role} className="matrix-table__cell matrix-table__cell--role">
                {ROLE_META[role].label.toUpperCase()}
              </div>
            ))}
          </div>

          {PERMISSIONS.map((perm) => (
            <div className="matrix-table__row" key={perm.id}>
              <div className="matrix-table__cell matrix-table__cell--module">
                <span className="perm-label">{perm.label}</span>
                <span className="perm-desc">{perm.description}</span>
              </div>
              {ROLES.map((role) => (
                <div key={role} className="matrix-table__cell matrix-table__cell--check">
                  <button
                    className={`checkbox ${matrix[perm.id][role] ? "checkbox--checked" : ""}`}
                    onClick={() => toggle(perm.id, role)}
                    aria-label={`${perm.label} for ${ROLE_META[role].label}`}
                    aria-checked={matrix[perm.id][role]}
                    role="checkbox"
                    disabled={loading || saving}
                  >
                    {matrix[perm.id][role] && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div className="notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <strong>Important Consideration</strong>
          <p>
            Updating permissions will take effect immediately for all active sessions. Changes are logged and attributed
            to your administrator account.
          </p>
        </div>
      </div>
    </div>
  );
}