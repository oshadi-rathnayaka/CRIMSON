import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Officer/Records.css";
import OfficerSidebar from "../../components/Officer/OfficerSidebar";
import { api } from "../../lib/api";
import { formatOfficerDate } from "../../lib/officerPreferences";

const DISTRICTS = ["", "Colombo", "Gampaha", "Kandy", "Galle", "Jaffna", "Kurunegala", "Puttalam"];
const CRIME_TYPES = ["", "Organized Crime", "Armed Robbery", "Assault", "Petty Theft", "Fraud", "Drug Offense"];
const RISK_LEVELS = ["", "Low", "Medium", "High"];
const LEGAL_STATUSES = ["", "Open", "On Bail", "Convicted", "Released"];

const defaultForm = {
  nic: "",
  fullName: "",
  age: "",
  alias: "",
  district: "",
  primaryCrimeType: "",
  riskLevel: "Medium",
  legalStatus: "Open",
  convictionCount: 0,
  pendingCaseCount: 0,
  notes: "",
};

const statusClass = {
  Open: "status-open",
  "On Bail": "status-bail",
  Convicted: "status-convicted",
  Released: "status-released",
};

const riskClass = {
  Low: "risk-low",
  Medium: "risk-medium",
  High: "risk-high",
};

export default function Records() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    district: "",
    crimeType: "",
    legalStatus: "",
    riskLevel: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOffenders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/offenders", {
        params: {
          search: filters.search,
          district: filters.district,
          crimeType: filters.crimeType,
          legalStatus: filters.legalStatus,
          riskLevel: filters.riskLevel,
        },
      });
      setRows(res.data?.data || []);
    } catch (err) {
      setRows([]);
      setError(err?.response?.data?.message || "Failed to fetch offenders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOffenders();
  }, [loadOffenders]);

  const stats = useMemo(() => {
    const total = rows.length;
    const highRisk = rows.filter((r) => r.riskLevel === "High").length;
    const openCases = rows.filter((r) => r.legalStatus === "Open" || r.legalStatus === "On Bail").length;
    const convicted = rows.filter((r) => r.legalStatus === "Convicted").length;
    return { total, highRisk, openCases, convicted };
  }, [rows]);

  const openCreateModal = () => {
    setEditId(null);
    setForm(defaultForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditId(row._id);
    setForm({
      nic: row.nic || "",
      fullName: row.fullName || "",
      age: row.age ?? "",
      alias: row.alias || "",
      district: row.district || "",
      primaryCrimeType: row.primaryCrimeType || "",
      riskLevel: row.riskLevel || "Medium",
      legalStatus: row.legalStatus || "Open",
      convictionCount: row.convictionCount || 0,
      pendingCaseCount: row.pendingCaseCount || 0,
      notes: row.notes || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
    setSaving(false);
  };

  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!form.nic.trim() || !form.fullName.trim() || !form.district || !form.primaryCrimeType) {
      setFormError("NIC, full name, district and crime type are required");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      ...form,
      age: form.age === "" ? null : Number(form.age),
      convictionCount: Number(form.convictionCount) || 0,
      pendingCaseCount: Number(form.pendingCaseCount) || 0,
    };

    try {
      if (editId) {
        await api.put(`/offenders/${editId}`, payload);
      } else {
        await api.post("/offenders", payload);
      }
      closeModal();
      loadOffenders();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save offender");
      setSaving(false);
    }
  };

  const onDelete = async (row) => {
    const ok = window.confirm(`Archive offender ${row.fullName} (${row.nic})?`);
    if (!ok) return;

    try {
      await api.delete(`/offenders/${row._id}`);
      loadOffenders();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to archive offender");
    }
  };

  return (
    <div className="rc-app officer-with-sidebar">
      <OfficerSidebar />

      <main className="rc-main">
        <div className="rc-page-header">
          <h1 className="rc-page-title">Criminal Records</h1>
          <p className="rc-page-desc">
            Manage offender profiles with secure add, edit, and archive operations.
          </p>
        </div>

        <div className="rc-filters-card">
          <div className="rc-filters-header-row">
            <div className="rc-filters-header">
              <span className="rc-filters-label">SEARCH FILTERS</span>
            </div>
            <button className="rc-search-btn" onClick={openCreateModal}>+ Add Offender</button>
          </div>

          <div className="rc-filters-row">
            <div className="rc-filter-field">
              <label className="rc-field-label">NIC / NAME / ALIAS</label>
              <input
                className="rc-input"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search offenders..."
              />
            </div>

            <div className="rc-filter-field">
              <label className="rc-field-label">DISTRICT</label>
              <select className="rc-select" value={filters.district} onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))}>
                <option value="">All Districts</option>
                {DISTRICTS.filter(Boolean).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="rc-filter-field">
              <label className="rc-field-label">CRIME TYPE</label>
              <select className="rc-select" value={filters.crimeType} onChange={(e) => setFilters((f) => ({ ...f, crimeType: e.target.value }))}>
                <option value="">All Types</option>
                {CRIME_TYPES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="rc-filter-field">
              <label className="rc-field-label">LEGAL STATUS</label>
              <select className="rc-select" value={filters.legalStatus} onChange={(e) => setFilters((f) => ({ ...f, legalStatus: e.target.value }))}>
                <option value="">All Statuses</option>
                {LEGAL_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="rc-filter-field">
              <label className="rc-field-label">RISK LEVEL</label>
              <select className="rc-select" value={filters.riskLevel} onChange={(e) => setFilters((f) => ({ ...f, riskLevel: e.target.value }))}>
                <option value="">All Risk Levels</option>
                {RISK_LEVELS.filter(Boolean).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="rc-stats-row rc-stats-row--cards">
          <div className="rc-stat-box"><span>Total Offenders</span><strong>{stats.total}</strong></div>
          <div className="rc-stat-box"><span>High Risk</span><strong>{stats.highRisk}</strong></div>
          <div className="rc-stat-box"><span>Open / Bail</span><strong>{stats.openCases}</strong></div>
          <div className="rc-stat-box"><span>Convicted</span><strong>{stats.convicted}</strong></div>
        </div>

        <div className="rc-history-card">
          <div className="rc-history-header">
            <span className="rc-history-title">Offenders Table</span>
            <button className="rc-view-all-btn" onClick={() => navigate("/officer/cases")}>OPEN CASES PAGE</button>
          </div>

          {error && <p className="rc-error-inline">{error}</p>}

          <div className="rc-table-wrap">
            <table className="rc-table">
              <thead>
                <tr>
                  <th>NIC</th>
                  <th>NAME</th>
                  <th>AGE</th>
                  <th>ALIAS</th>
                  <th>DISTRICT</th>
                  <th>CRIME TYPE</th>
                  <th>RISK</th>
                  <th>LEGAL STATUS</th>
                  <th>PENDING</th>
                  <th>UPDATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="rc-empty">Loading offenders...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={11} className="rc-empty">No offenders found</td></tr>
                ) : rows.map((r) => (
                  <tr key={r._id}>
                    <td className="rc-td-caseid">{r.nic}</td>
                    <td>{r.fullName}</td>
                    <td>{r.age ?? "-"}</td>
                    <td>{r.alias || "-"}</td>
                    <td>{r.district}</td>
                    <td>{r.primaryCrimeType}</td>
                    <td><span className={`rc-chip ${riskClass[r.riskLevel] || "risk-medium"}`}>{r.riskLevel}</span></td>
                    <td><span className={`rc-status-badge ${statusClass[r.legalStatus] || "status-open"}`}>{r.legalStatus}</span></td>
                    <td>{r.pendingCaseCount ?? 0}</td>
                    <td>{formatOfficerDate(r.updatedAt, { year: "numeric", month: "2-digit", day: "2-digit" })}</td>
                    <td>
                      <div className="rc-actions-cell">
                        <button className="rc-view-btn" onClick={() => openEditModal(r)}>EDIT</button>
                        <button className="rc-view-btn rc-view-btn--danger" onClick={() => onDelete(r)}>DELETE</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className="rc-modal-overlay" onClick={closeModal}>
          <div className="rc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rc-modal-head">
              <h3>{editId ? "Edit Offender" : "Add Offender"}</h3>
              <button className="rc-modal-close" onClick={closeModal}>x</button>
            </div>

            <form className="rc-modal-form" onSubmit={onSave}>
              <div className="rc-modal-grid">
                <label>
                  NIC *
                  <input value={form.nic} onChange={(e) => setForm((f) => ({ ...f, nic: e.target.value }))} />
                </label>
                <label>
                  Full Name *
                  <input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
                </label>
                <label>
                  Age
                  <input type="number" min="0" max="120" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
                </label>
                <label>
                  Alias
                  <input value={form.alias} onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))} />
                </label>
                <label>
                  District *
                  <select value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}>
                    <option value="">Select district</option>
                    {DISTRICTS.filter(Boolean).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
                <label>
                  Primary Crime Type *
                  <select value={form.primaryCrimeType} onChange={(e) => setForm((f) => ({ ...f, primaryCrimeType: e.target.value }))}>
                    <option value="">Select type</option>
                    {CRIME_TYPES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  Risk Level
                  <select value={form.riskLevel} onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value }))}>
                    {RISK_LEVELS.filter(Boolean).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label>
                  Legal Status
                  <select value={form.legalStatus} onChange={(e) => setForm((f) => ({ ...f, legalStatus: e.target.value }))}>
                    {LEGAL_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Convictions
                  <input type="number" min="0" value={form.convictionCount} onChange={(e) => setForm((f) => ({ ...f, convictionCount: e.target.value }))} />
                </label>
                <label>
                  Pending Cases
                  <input type="number" min="0" value={form.pendingCaseCount} onChange={(e) => setForm((f) => ({ ...f, pendingCaseCount: e.target.value }))} />
                </label>
              </div>

              <label className="rc-notes-field">
                Notes
                <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </label>

              {formError && <p className="rc-error-inline">{formError}</p>}

              <div className="rc-modal-actions">
                <button type="button" className="rc-action-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="rc-search-btn" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
