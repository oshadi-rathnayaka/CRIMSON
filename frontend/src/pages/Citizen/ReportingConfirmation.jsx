import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/ReportingConfirmation.css";

const ReportingConfirmation = () => {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const caseId   = state?.caseId    || "—";
  const address  = state?.location?.address || state?.location?.coords
    ? `${state?.location?.address || ""}`
    : "Location not recorded";
  const time     = state?.time   || "—";
  const date     = state?.date   || "—";
  const catLabel = state?.catLabel || state?.category || "—";
  const severity = state?.severity || "—";

  const handleCopy = () => {
    if (navigator.clipboard && caseId !== "—") {
      navigator.clipboard.writeText(caseId).catch(() => {});
    }
  };

  const handleDownloadReceipt = () => {
    const receiptHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CRIMSON Report Receipt – ${caseId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f9fafb; color: #0F1419; }
    .page { max-width: 640px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #DC143C 0%, #B8102B 100%); padding: 32px 40px; text-align: center; color: #fff; }
    .header-logo { font-size: 28px; font-weight: 900; letter-spacing: 3px; margin-bottom: 6px; }
    .header-sub { font-size: 14px; opacity: 0.85; letter-spacing: 0.5px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 20px; padding: 4px 14px; font-size: 12px; margin-top: 10px; }
    .body { padding: 32px 40px; }
    .case-id-box { background: #fff5f5; border: 2px solid #DC143C; border-radius: 10px; padding: 18px 24px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; }
    .case-id-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; margin-bottom: 4px; }
    .case-id-value { font-size: 22px; font-weight: 800; color: #DC143C; letter-spacing: 1px; }
    .status-pill { background: #dcfce7; color: #16a34a; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; margin-bottom: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .field { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .field:last-child { border-bottom: none; }
    .field-label { font-size: 13px; color: #6B7280; font-weight: 600; }
    .field-value { font-size: 13px; font-weight: 700; color: #0F1419; text-align: right; max-width: 60%; }
    .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-top: 24px; font-size: 12px; color: #92400e; line-height: 1.6; }
    .footer { background: #1F2937; color: #9CA3AF; text-align: center; padding: 20px 40px; font-size: 12px; }
    .footer strong { color: #e5e7eb; }
    @media print { body { background: #fff; } .page { box-shadow: none; margin: 0; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-logo">🛡️ CRIMSON</div>
      <div class="header-sub">Crime Reporting &amp; Predictive Policing Platform</div>
      <div class="badge">✓ Official Submission Receipt</div>
    </div>
    <div class="body">
      <div class="case-id-box">
        <div>
          <div class="case-id-label">Case Reference ID</div>
          <div class="case-id-value">${caseId}</div>
        </div>
        <div class="status-pill">✓ Received</div>
      </div>

      <div class="section-title">Incident Details</div>
      <div class="field">
        <span class="field-label">Crime Category</span>
        <span class="field-value">${catLabel}</span>
      </div>
      <div class="field">
        <span class="field-label">Severity Level</span>
        <span class="field-value">${severity}</span>
      </div>
      <div class="field">
        <span class="field-label">Date Submitted</span>
        <span class="field-value">${date}</span>
      </div>
      <div class="field">
        <span class="field-label">Time Submitted</span>
        <span class="field-value">${time}</span>
      </div>
      <div class="field">
        <span class="field-label">Location</span>
        <span class="field-value">${address}</span>
      </div>

      <div class="note">
        ⚠️ Keep this receipt for your records. Your case reference ID is required to track your report status.
        This document was generated automatically by the CRIMSON system upon successful submission.
      </div>
    </div>
    <div class="footer">
      <strong>CRIMSON Platform</strong> — Sri Lanka Crime Reporting System<br/>
      © 2026 CRIMSON Platform. All rights reserved. | Generated: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([receiptHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CRIMSON-Receipt-${caseId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="confirmation-page">
      <CitizenNavbar />

      <div className="confirmation-container">

        <main className="main-content">
          <div className="success-circle">
            <div className="checkmark">✓</div>
          </div>

          <h1>Report Submitted Successfully</h1>
          <p className="subtitle">
            Your report has been securely encrypted and received by the CRIMSON system.
            A reference number has been generated for your records.
          </p>

          <div className="case-card">
            <div className="case-header">
              <h2>CASE REFERENCE ID</h2>
              <div className="case-id">
                <span>{caseId}</span>
                <button className="copy-btn" title="Copy to clipboard" onClick={handleCopy}>
                  ⧉
                </button>
              </div>
            </div>

            <div className="case-details">
              <div className="detail-item">
                <span className="label">Category</span>
                <span className="value">{catLabel}</span>
              </div>
              <div className="detail-item">
                <span className="label">Submitted</span>
                <span className="value">{date} at {time}</span>
              </div>
              <div className="detail-item">
                <span className="label">Location</span>
                <span className="value">{address}</span>
              </div>
            </div>
          </div>

          <div className="status-timeline">
            <h3>What happens next?</h3>

            <div className="timeline-item completed">
              <div className="status-dot completed"></div>
              <div className="status-content">
                <strong>Submission Received</strong>
                <p>Your report has been logged and secured.</p>
              </div>
            </div>

            <div className="timeline-item active">
              <div className="status-dot active"></div>
              <div className="status-content">
                <strong>AI Priority Analysis</strong>
                <p>CRIMSON AI is analyzing the incident details to assign agency and routing.</p>
                <p className="progress">In Progress – Est. 5 min</p>
              </div>
            </div>

            <div className="timeline-item pending">
              <div className="status-dot"></div>
              <div className="status-content">
                <strong>Officer Assignment</strong>
                <p>An investigating officer will be assigned based on AI recommendation.</p>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn primary" onClick={() => navigate("/my-reports")}>
              Track Status →
            </button>
            <button className="btn secondary" onClick={handleDownloadReceipt}>Download Receipt</button>
          </div>

          <div className="emergency-box">
            <div className="emergency-content">
              <h4>Need immediate support?</h4>
              <p>If you are in danger or need victim support services, help is available 24/7.</p>
              <a href="tel:119" className="emergency-link">
                ☎ Contact Support
              </a>
            </div>
          </div>
        </main>

      </div>
      <CitizenFooter />
    </div>
  );
};

export default ReportingConfirmation;