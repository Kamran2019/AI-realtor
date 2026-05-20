import { useEffect, useMemo, useState } from "react";
import FormError from "../ui/FormError.jsx";
import { getLegalPackRisks, uploadLegalPack } from "../../services/legalPackApi.js";

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const formatRiskKey = (key) =>
  (key || "Risk")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-GB") : "Not parsed");

const severityClass = (severity) => `risk-badge ${severity || "medium"}`;

const LegalPackPanel = ({ canEdit, onPropertyUpdated, property }) => {
  const [summary, setSummary] = useState({
    legalPack: property?.legalPack || {},
    risks: property?.risks || [],
    scoring: property?.scoring || {}
  });
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSummary({
      legalPack: property?.legalPack || {},
      risks: property?.risks || [],
      scoring: property?.scoring || {}
    });
  }, [property]);

  useEffect(() => {
    let isMounted = true;

    const loadRisks = async () => {
      if (!property?.id) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await getLegalPackRisks(property.id);

        if (isMounted) {
          setSummary(response.data.data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Legal pack risks could not be loaded."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRisks();

    return () => {
      isMounted = false;
    };
  }, [property?.id]);

  const riskCountLabel = useMemo(() => {
    const count = summary.risks?.length || 0;

    return `${count} red flag${count === 1 ? "" : "s"}`;
  }, [summary.risks]);

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setUrl("");
    setError("");
    setMessage("");
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
    setFile(null);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await uploadLegalPack(property.id, {
        file,
        url: url.trim()
      });
      const nextProperty = response.data.data.property;

      setSummary({
        legalPack: nextProperty.legalPack || {},
        risks: nextProperty.risks || [],
        scoring: nextProperty.scoring || {}
      });
      setFile(null);
      setUrl("");
      onPropertyUpdated(nextProperty);
      setMessage("Legal pack parsed.");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Legal pack could not be parsed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="property-detail-panel legal-pack-panel" aria-labelledby="legal-pack-title">
      <div className="panel-title-row">
        <h2 id="legal-pack-title">Legal pack</h2>
        <span className="risk-count">{isLoading ? "Loading" : riskCountLabel}</span>
      </div>

      <dl className="property-detail-list">
        <div>
          <dt>Status</dt>
          <dd>{summary.legalPack?.status || "missing"}</dd>
        </div>
        <div>
          <dt>Parsed</dt>
          <dd>{formatDateTime(summary.legalPack?.parsedAt)}</dd>
        </div>
        <div>
          <dt>Checksum</dt>
          <dd>{summary.legalPack?.checksum ? summary.legalPack.checksum.slice(0, 12) : "TBC"}</dd>
        </div>
        <div>
          <dt>Risk score</dt>
          <dd>{summary.scoring?.riskScore ?? "TBC"}</dd>
        </div>
      </dl>

      <div className="risk-badge-row" aria-label="Legal pack red flags">
        {summary.risks?.length ? (
          summary.risks.map((risk) => (
            <span className={severityClass(risk.severity)} key={risk.key} title={risk.note || ""}>
              {formatRiskKey(risk.key)}
            </span>
          ))
        ) : (
          <span className="risk-badge clear">No red flags</span>
        )}
      </div>

      {canEdit ? (
        <form className="legal-pack-form" onSubmit={handleSubmit}>
          <label>
            Upload PDF
            <input
              accept="application/pdf"
              disabled={isSubmitting}
              onChange={handleFileChange}
              type="file"
            />
          </label>
          <label>
            PDF URL
            <input
              disabled={isSubmitting}
              onChange={handleUrlChange}
              placeholder="https://example.com/legal-pack.pdf"
              type="url"
              value={url}
            />
          </label>
          <button className="primary-button" disabled={isSubmitting || (!file && !url.trim())} type="submit">
            {isSubmitting ? "Parsing..." : "Parse legal pack"}
          </button>
        </form>
      ) : null}

      <FormError>{error}</FormError>
      {message ? <p className="form-success">{message}</p> : null}
    </section>
  );
};

export default LegalPackPanel;
