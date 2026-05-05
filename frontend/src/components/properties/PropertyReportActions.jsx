import { useState } from "react";
import { Link } from "react-router-dom";
import { downloadReport, generatePropertyReport } from "../../services/reportApi.js";
import FormError from "../ui/FormError.jsx";

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const sanitizeFileName = (value) =>
  `${value || "property-report"}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "property-report";

const saveBlob = (blobData, fileName, mimeType = "application/pdf") => {
  const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const PropertyReportActions = ({ onReportGenerated, propertyId }) => {
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleGenerate = async () => {
    setError("");
    setStatusMessage("");
    setIsGenerating(true);

    try {
      const response = await generatePropertyReport(propertyId);
      const generatedReport = response.data.data.report;

      setReport(generatedReport);
      setStatusMessage("Report generated.");
      onReportGenerated?.(generatedReport);
    } catch (generateError) {
      setError(getErrorMessage(generateError, "Report could not be generated."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const reportId = report?.id;

    if (!reportId) {
      return;
    }

    setError("");
    setIsDownloading(true);

    try {
      const response = await downloadReport(reportId);
      const fileName = `${sanitizeFileName(report.title)}.pdf`;

      saveBlob(response.data, fileName, response.headers?.["content-type"]);
    } catch (downloadError) {
      setError(getErrorMessage(downloadError, "Report could not be downloaded."));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="property-report-actions">
      <div className="report-action-row">
        <button className="secondary-button" disabled={isGenerating} onClick={handleGenerate} type="button">
          {isGenerating ? "Generating..." : "Generate PDF"}
        </button>
        {report?.status === "ready" ? (
          <button className="secondary-button" disabled={isDownloading} onClick={handleDownload} type="button">
            {isDownloading ? "Downloading..." : "Download PDF"}
          </button>
        ) : null}
        <Link to="/reports">Reports</Link>
      </div>
      <FormError>{error}</FormError>
      {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
    </div>
  );
};

export default PropertyReportActions;
