import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Admin/DataManagement.css";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import {
  commitImportOperation,
  generateDataExport,
  getDataManagementActivity,
  getDataManagementOverview,
  previewExportData,
  validateImportFile,
} from "../../api/dataManagement";

const DATA_MODULES = [
  {
    id: "crimeRecords",
    label: "Crime Records",
    desc: "Includes incident reports, types, and locations.",
  },
  {
    id: "victimProfiles",
    label: "Victim Profiles",
    desc: "Personally identifiable information and contact details.",
  },
  {
    id: "intelligenceAnalytics",
    label: "Intelligence Analytics",
    desc: "Trend predictions, heatmaps, and pattern clusters.",
  },
];

const DIVISIONS = ["All Divisions", "Colombo", "Gampaha", "Kandy", "Galle", "Jaffna"];

const formatCompact = (value) => {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(number);
};

const formatInteger = (value) => new Intl.NumberFormat("en").format(Number(value) || 0);

export default function DataManagement() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);
  const [modules, setModules] = useState({ crimeRecords: true, victimProfiles: false, intelligenceAnalytics: true });
  const [division, setDivision] = useState("All Divisions");

  const [overviewLoading, setOverviewLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [activity, setActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    totalRecords: 0,
    storageLimit: 1000000,
    storageUsed: 0,
    storagePercent: 0,
  });

  const [validation, setValidation] = useState({
    logs: [{ type: "info", text: "Upload a CSV/XLSX file to run backend validation." }],
    canImport: false,
    errorCount: 0,
    warningCount: 0,
  });
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSummary, setPreviewSummary] = useState(null);

  const [exportLoading, setExportLoading] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const selectedModuleIds = useMemo(
    () => Object.keys(modules).filter((id) => modules[id]),
    [modules]
  );

  const handleAdminAuthFailure = (err, fallbackMessage) => {
    const statusCode = err?.response?.status;
    if (statusCode === 401 || statusCode === 403) {
      navigate("/admin/login", { replace: true });
      return;
    }
    setPageError(fallbackMessage);
  };

  const loadOverview = async () => {
    setOverviewLoading(true);
    setPageError("");
    try {
      const [overviewRes, activityRes] = await Promise.all([
        getDataManagementOverview(),
        getDataManagementActivity(),
      ]);

      const overview = overviewRes.data?.data || {};
      setSystemHealth(overview.systemHealth || {
        totalRecords: 0,
        storageLimit: 1000000,
        storageUsed: 0,
        storagePercent: 0,
      });

      const activityItems = activityRes.data?.data?.items || overview.recentActivity || [];
      setActivity(activityItems);
    } catch (err) {
      handleAdminAuthFailure(err, "Failed to load data management metrics from backend.");
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const runValidation = async (selectedFile) => {
    if (!selectedFile) return;

    setValidating(true);
    setPageError("");
    setValidation({
      logs: [{ type: "info", text: `Validating ${selectedFile.name}...` }],
      canImport: false,
      errorCount: 0,
      warningCount: 0,
    });

    try {
      const res = await validateImportFile(selectedFile);
      const backendValidation = res.data?.data?.validation;
      if (backendValidation) {
        setValidation(backendValidation);
      }
    } catch (err) {
      handleAdminAuthFailure(err, "Failed to validate file with backend.");
      setValidation({
        logs: [{ type: "error", text: "Validation request failed." }],
        canImport: false,
        errorCount: 1,
        warningCount: 0,
      });
    } finally {
      setValidating(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;

    setFile(dropped);
    await runValidation(dropped);
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    await runValidation(selected);
  };

  const downloadErrorReport = () => {
    const errorLines = validation.logs.filter((line) => line.type === "error" || line.type === "warn");
    if (errorLines.length === 0) return;

    const contents = [
      `File: ${file?.name || "N/A"}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      ...errorLines.map((line) => `[${line.type.toUpperCase()}] ${line.text}`),
    ].join("\n");

    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `validation_report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProceedImport = async () => {
    if (!file || importing || validating) return;

    setImporting(true);
    setPageError("");
    try {
      await commitImportOperation({
        fileName: file.name,
        fileSizeBytes: file.size,
        records: 0,
        errorCount: validation.errorCount,
        warningCount: validation.warningCount,
      });
      await loadOverview();
      setValidation((prev) => ({
        ...prev,
        logs: [...prev.logs, { type: "pass", text: "Import operation recorded successfully." }],
      }));
    } catch (err) {
      handleAdminAuthFailure(err, "Failed to commit import operation.");
    } finally {
      setImporting(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPageError("");
    try {
      const res = await previewExportData({
        modules: selectedModuleIds,
        division,
      });
      setPreviewSummary(res.data?.data || null);
    } catch (err) {
      handleAdminAuthFailure(err, "Failed to preview export segment.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = async () => {
    if (selectedModuleIds.length === 0) {
      setPageError("Select at least one data module before exporting.");
      return;
    }

    setExportLoading(true);
    setExportDone(false);
    setExportMessage("");
    setPageError("");

    try {
      const res = await generateDataExport({
        dateFrom,
        dateTo,
        modules: selectedModuleIds,
        division,
        format: "csv",
      });

      const data = res.data?.data;
      setExportDone(true);
      setExportMessage(`${data?.fileName || "Export"} ready (${formatInteger(data?.estimatedRecords)} records).`);
      await loadOverview();
      setTimeout(() => setExportDone(false), 2500);
    } catch (err) {
      handleAdminAuthFailure(err, "Failed to generate export.");
    } finally {
      setExportLoading(false);
    }
  };

  const validationBadge = validation.errorCount > 0
    ? "Errors Detected"
    : validation.warningCount > 0
      ? "Warnings Detected"
      : validation.canImport
        ? "Validated"
        : "Pending";

  return (
    <div className="dm-page admin-with-sidebar">
      <AdminSidebar />
      <div className="dm-header">
        <h1 className="dm-header__title">Data Management and Import</h1>
        <p className="dm-header__subtitle">
          Administer large-scale dataset ingestion and secure extraction. Ensure all data follows the standardized
          police department format for forensic integrity.
        </p>
      </div>

      {pageError && (
        <div className="privacy-notice" style={{ marginBottom: 14 }}>
          <p><strong>Backend Error:</strong> {pageError}</p>
        </div>
      )}

      <div className="dm-grid">
        <div className="dm-col">
          <div className="dm-card">
            <div className="dm-card__heading">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <h2 className="dm-card__title">Bulk Data Import</h2>
            </div>

            <div
              className={`dropzone ${dragOver ? "dropzone--over" : ""} ${file ? "dropzone--filled" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx" hidden onChange={handleFileChange} />
              <div className="dropzone__icon">
                {file ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <polyline points="9 15 11 17 15 13" />
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8">
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
                )}
              </div>
              <p className="dropzone__title">{file ? file.name : "Upload CSV or Excel File"}</p>
              <p className="dropzone__sub">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ${validating ? "Validating..." : "Ready for import review"}`
                  : "Drag and drop your data file here or browse locally.\nSupported formats: .csv, .xlsx (Max 50MB)."}
              </p>
              {!file && (
                <button
                  className="btn btn--primary btn--sm"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Select File
                </button>
              )}
            </div>

            <div className="validation">
              <div className="validation__header">
                <span className="validation__label">Validation Status</span>
                <span className="validation__badge">{validationBadge}</span>
              </div>
              <div className="validation__log">
                {validation.logs.map((line, i) => (
                  <p key={i} className={`vlog vlog--${line.type}`}>
                    <span className="vlog__prefix">
                      {line.type === "info" && "[INFO]"}
                      {line.type === "pass" && "[PASS]"}
                      {line.type === "error" && "[ERROR]"}
                      {line.type === "warn" && "[WARN]"}
                    </span>
                    {" "}{line.text}
                  </p>
                ))}
              </div>
              <div className="validation__actions">
                <button className="btn btn--ghost btn--sm" onClick={downloadErrorReport}>
                  Download Error Report
                </button>
                <button
                  className="btn btn--link btn--sm"
                  onClick={handleProceedImport}
                  disabled={!file || validating || importing || validation.errorCount > 0}
                >
                  {importing ? "Importing..." : "Proceed to Import"}
                </button>
              </div>
            </div>
          </div>

          <div className="dm-card dm-card--flat">
            <h3 className="dm-card__section-title">Recent Activity</h3>
            <div className="activity-list">
              {activity.length === 0 ? (
                <div className="activity-item">
                  <div className="activity-info">
                    <span className="activity-name">No recent activity</span>
                    <span className="activity-meta">Operations will appear after imports/exports.</span>
                  </div>
                </div>
              ) : activity.map((item) => (
                <div className="activity-item" key={item.id}>
                  <div className={`activity-icon activity-icon--${item.icon}`}>
                    {item.icon === "success" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                  </div>
                  <div className="activity-info">
                    <span className="activity-name">{item.name}</span>
                    <span className="activity-meta">{item.meta}</span>
                  </div>
                  <span className={`badge ${item.badgeClass}`}>{item.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dm-col">
          <div className="dm-card">
            <div className="dm-card__heading">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <h2 className="dm-card__title">Dataset Export</h2>
            </div>

            <label className="field-label">Select Date Range</label>
            <div className="date-range">
              <div className="date-input-wrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input className="date-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="date-input-wrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input className="date-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <label className="field-label" style={{ marginTop: 18 }}>Select Data Modules</label>
            <div className="module-list">
              {DATA_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className={`module-item ${modules[mod.id] ? "module-item--checked" : ""}`}
                  onClick={() => setModules((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                >
                  <div className={`dm-checkbox ${modules[mod.id] ? "dm-checkbox--checked" : ""}`}>
                    {modules[mod.id] && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="module-name">{mod.label}</div>
                    <div className="module-desc">{mod.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <label className="field-label" style={{ marginTop: 18 }}>Division Filter</label>
            <select className="division-select" value={division} onChange={(e) => setDivision(e.target.value)}>
              {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
            </select>

            <button
              className={`btn btn--export ${exportLoading ? "btn--loading" : ""} ${exportDone ? "btn--done" : ""}`}
              onClick={handleExport}
              disabled={exportLoading || overviewLoading}
            >
              {exportLoading ? (
                <>
                  <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Generating...
                </>
              ) : exportDone ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Export Ready!
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Generate Export (PDF/CSV)
                </>
              )}
            </button>

            <button className="btn btn--preview" onClick={handlePreview} disabled={previewLoading || overviewLoading}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {previewLoading ? "Loading Preview..." : "Preview Segment"}
            </button>

            {exportMessage && (
              <div className="privacy-notice" style={{ marginTop: 10 }}>
                <p><strong>Export:</strong> {exportMessage}</p>
              </div>
            )}

            {previewSummary && (
              <div className="privacy-notice" style={{ marginTop: 10 }}>
                <p>
                  <strong>Preview:</strong> {formatInteger(previewSummary.estimatedRecords)} estimated records from
                  {" "}{previewSummary.selectedModules?.length || 0} modules.
                </p>
              </div>
            )}

            <div className="privacy-notice">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>
                <strong>Privacy Notice:</strong> Exported data may contain sensitive classified information. Ensure you
                are authorized to handle this data under the Digital Records Act.
              </p>
            </div>
          </div>

          <div className="dm-card dm-card--flat system-health">
            <span className="system-health__label">System Health</span>
            <div className="system-health__row">
              <div className="health-stat">
                <span className="health-stat__title">Total Records Stored</span>
                <span className="health-stat__value">
                  {overviewLoading ? "..." : formatCompact(systemHealth.totalRecords)}
                </span>
              </div>
              <div className="health-stat health-stat--bar">
                <span className="health-stat__title">Storage Capacity</span>
                <div className="health-bar">
                  <div className="health-bar__fill" style={{ width: `${systemHealth.storagePercent || 0}%` }} />
                </div>
                <div className="activity-meta" style={{ marginTop: 6 }}>
                  {formatInteger(systemHealth.storageUsed)} used of {formatInteger(systemHealth.storageLimit)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
