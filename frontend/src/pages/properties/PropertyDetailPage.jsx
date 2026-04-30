import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FormError from "../../components/ui/FormError.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getProperty, updateProperty } from "../../services/propertyApi.js";

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const formatMoney = (money) => {
  if (money?.amount === null || money?.amount === undefined) {
    return "TBC";
  }

  return new Intl.NumberFormat("en-GB", {
    currency: money.currency || "GBP",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(money.amount);
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-GB") : "TBC");

const PropertyDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = ["admin", "sub_admin"].includes(user?.role);
  const [property, setProperty] = useState(null);
  const [form, setForm] = useState({ description: "", status: "new", tags: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProperty = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getProperty(id);
        const nextProperty = response.data.data.property;

        if (isMounted) {
          setProperty(nextProperty);
          setForm({
            description: nextProperty.description || "",
            status: nextProperty.status || "new",
            tags: (nextProperty.tags || []).join(", ")
          });
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Property could not be loaded."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProperty();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const title = useMemo(() => {
    if (!property) {
      return "Property";
    }

    return [property.address?.line1, property.address?.city].filter(Boolean).join(", ") || "Property";
  }, [property]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
    setStatusMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    setIsSaving(true);

    try {
      const payload = {
        description: form.description.trim() || null,
        status: form.status.trim().toLowerCase(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      };
      const response = await updateProperty(id, payload);

      setProperty(response.data.data.property);
      setStatusMessage("Property updated.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Property could not be updated."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="route-status">Loading property...</p>;
  }

  if (!property) {
    return (
      <section className="properties-page" aria-labelledby="property-error-title">
        <p className="eyebrow">Properties</p>
        <h1 id="property-error-title">Property unavailable</h1>
        <FormError>{error}</FormError>
        <Link to="/properties">Back to properties</Link>
      </section>
    );
  }

  return (
    <section className="property-detail-page" aria-labelledby="property-title">
      <Link to="/properties">Back to properties</Link>
      <div className="property-detail-header">
        <div>
          <p className="eyebrow">{property.status || "new"}</p>
          <h1 id="property-title">{title}</h1>
          <p>{property.description || "No description captured yet."}</p>
        </div>
        {property.images?.[0]?.url ? (
          <img
            alt={property.images[0]?.caption || title}
            className="property-detail-image"
            src={property.images[0].url}
          />
        ) : null}
      </div>

      <FormError>{error}</FormError>
      {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

      <div className="property-detail-layout">
        <section className="property-detail-panel" aria-labelledby="summary-title">
          <h2 id="summary-title">Summary</h2>
          <dl className="property-detail-list">
            <div>
              <dt>Guide price</dt>
              <dd>{formatMoney(property.prices?.guide)}</dd>
            </div>
            <div>
              <dt>Auction date</dt>
              <dd>{formatDate(property.auctionDate)}</dd>
            </div>
            <div>
              <dt>Postcode</dt>
              <dd>{property.address?.postcode || "TBC"}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{property.type || "TBC"}</dd>
            </div>
            <div>
              <dt>Tenure</dt>
              <dd>{property.tenure || "TBC"}</dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd>{property.scoring?.total ?? "TBC"}</dd>
            </div>
            <div>
              <dt>Yield score</dt>
              <dd>{property.scoring?.yieldScore ?? "TBC"}</dd>
            </div>
            <div>
              <dt>Legal pack</dt>
              <dd>{property.legalPack?.status || "missing"}</dd>
            </div>
          </dl>
          {property.tags?.length ? (
            <div className="tag-row">
              {property.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
          {property.source?.url ? (
            <a href={property.source.url} rel="noreferrer" target="_blank">
              Source listing
            </a>
          ) : null}
        </section>

        {canEdit ? (
          <form className="property-edit-panel" onSubmit={handleSubmit}>
            <h2>Dashboard edits</h2>
            <label>
              Status
              <select name="status" onChange={handleInputChange} value={form.status}>
                <option value="new">New</option>
                <option value="watching">Watching</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>
              Tags
              <input name="tags" onChange={handleInputChange} placeholder="yield, north" value={form.tags} />
            </label>
            <label>
              Description
              <textarea name="description" onChange={handleInputChange} rows="8" value={form.description} />
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save"}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
};

export default PropertyDetailPage;
