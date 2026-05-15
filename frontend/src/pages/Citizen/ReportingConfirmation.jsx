import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

  const handleDownloadReceipt = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const margin = 48;
      let y = height - margin;

      page.drawRectangle({
        x: 0,
        y: height - 120,
        width,
        height: 120,
        color: rgb(0.86, 0.08, 0.24),
      });

      page.drawText("CRIMSON", {
        x: margin,
        y: height - 72,
        size: 26,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText("Crime Report Submission Receipt", {
        x: margin,
        y: height - 95,
        size: 12,
        font,
        color: rgb(1, 1, 1),
      });

      y = height - 155;

      page.drawText("Case Reference ID", {
        x: margin,
        y,
        size: 10,
        font,
        color: rgb(0.42, 0.45, 0.5),
      });
      y -= 24;
      page.drawText(String(caseId), {
        x: margin,
        y,
        size: 20,
        font: fontBold,
        color: rgb(0.86, 0.08, 0.24),
      });

      y -= 36;

      const drawField = (label, value) => {
        page.drawText(label, {
          x: margin,
          y,
          size: 11,
          font,
          color: rgb(0.42, 0.45, 0.5),
        });
        page.drawText(String(value || "-"), {
          x: margin + 170,
          y,
          size: 11,
          font: fontBold,
          color: rgb(0.06, 0.08, 0.1),
        });
        y -= 24;
      };

      drawField("Crime Category", catLabel);
      drawField("Severity Level", severity);
      drawField("Date Submitted", date);
      drawField("Time Submitted", time);

      page.drawText("Location", {
        x: margin,
        y,
        size: 11,
        font,
        color: rgb(0.42, 0.45, 0.5),
      });
      y -= 16;

      const wrappedAddress = String(address || "Location not recorded").match(/.{1,75}(\s|$)/g) || ["Location not recorded"];
      wrappedAddress.forEach((line) => {
        page.drawText(line.trim(), {
          x: margin,
          y,
          size: 10,
          font,
          color: rgb(0.06, 0.08, 0.1),
        });
        y -= 14;
      });

      y -= 20;
      page.drawRectangle({
        x: margin,
        y: y - 58,
        width: width - margin * 2,
        height: 58,
        color: rgb(1, 0.98, 0.92),
      });

      page.drawText("Keep this receipt for your records. Use the Case Reference ID", {
        x: margin + 10,
        y: y - 22,
        size: 10,
        font,
        color: rgb(0.57, 0.25, 0.05),
      });
      page.drawText("to track report status within the CRIMSON platform.", {
        x: margin + 10,
        y: y - 36,
        size: 10,
        font,
        color: rgb(0.57, 0.25, 0.05),
      });

      page.drawText(`Generated: ${new Date().toLocaleString()}`, {
        x: margin,
        y: 36,
        size: 9,
        font,
        color: rgb(0.5, 0.53, 0.58),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CRIMSON-Receipt-${caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: open print dialog if PDF generation fails for any reason
      window.print();
    }
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