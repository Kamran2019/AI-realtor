import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FormError from "../../components/ui/FormError.jsx";
import { downloadReport, listReports } from "../../services/reportApi.js";

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date(value))
    : "TBC";

const formatStatus = (value) =>
  (value || "unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getPropertyLabel = (report) => {
  const property = report.property;

  return (
    [property?.address?.line1, property?.address?.city, property?.address?.postcode]
      .filter(Boolean)
      .join(", ") ||
    report.metadata?.propertyAddress ||
    "Property"
  );
};

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

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await listReports();

        if (isMounted) {
          setReports(response.data.data.reports);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Reports could not be loaded."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownload = async (report) => {
    setError("");
    setDownloadingId(report.id);

    try {
      const response = await downloadReport(report.id);
      const fileName = `${sanitizeFileName(report.title)}.pdf`;

      saveBlob(response.data, fileName, response.headers?.["content-type"]);
    } catch (downloadError) {
      setError(getErrorMessage(downloadError, "Report could not be downloaded."));
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <section className="reports-page" aria-labelledby="reports-title">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1 id="reports-title">Investor reports</h1>
        </div>
        <Link className="secondary-button" to="/properties">
          Properties
        </Link>
      </div>

      <FormError>{error}</FormError>

      {isLoading ? (
        <p>Loading reports...</p>
      ) : reports.length ? (
        <div className="table-wrap">
          <table className="users-table reports-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Status</th>
                <th>Generated</th>
                <th>Score</th>
                <th>Risk flags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const propertyLabel = getPropertyLabel(report);

                return (
                  <tr key={report.id}>
                    <td>
                      {report.propertyId ? (
                        <Link to={`/properties/${report.propertyId}`}>{propertyLabel}</Link>
                      ) : (
                        propertyLabel
                      )}
                      <span className="table-subtext">{report.title}</span>
                    </td>
                    <td>
                      <span className={`report-status ${report.status}`}>{formatStatus(report.status)}</span>
                      {report.errorMessage ? <span className="table-subtext">{report.errorMessage}</span> : null}
                    </td>
                    <td>{formatDate(report.generatedAt || report.createdAt)}</td>
                    <td>{report.metadata?.dealScore ?? "TBC"}</td>
                    <td>{report.metadata?.riskCount ?? 0}</td>
                    <td>
                      {report.status === "ready" ? (
                        <button
                          className="text-button"
                          disabled={downloadingId === report.id}
                          onClick={() => handleDownload(report)}
                          type="button"
                        >
                          {downloadingId === report.id ? "Downloading..." : "Download"}
                        </button>
                      ) : (
                        <span className="table-subtext">Unavailable</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No reports yet.</p>
      )}
    </section>
  );
};

export default ReportsPage;
