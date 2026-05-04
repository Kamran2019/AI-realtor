import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BookmarkButton from "../../components/properties/BookmarkButton.jsx";
import DealScoreBadge from "../../components/properties/DealScoreBadge.jsx";
import PropertyNotes from "../../components/properties/PropertyNotes.jsx";
import FormError from "../../components/ui/FormError.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { listBookmarks } from "../../services/bookmarkApi.js";
import { getProperty, recalculatePropertyScore, updateProperty } from "../../services/propertyApi.js";

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

const formatNumber = (value) =>
  value === null || value === undefined ? "TBC" : new Intl.NumberFormat("en-GB").format(value);

const formatPercent = (value) => (value === null || value === undefined ? "TBC" : `${value}%`);

const formatCategory = (value) =>
  (value || "TBC")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getBookmarkPropertyId = (bookmark) =>
  typeof bookmark.propertyId === "string" ? bookmark.propertyId : bookmark.property?.id;

const PropertyDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = ["admin", "sub_admin"].includes(user?.role);
  const [property, setProperty] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [form, setForm] = useState({ description: "", status: "new", tags: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProperty = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [propertyResponse, bookmarksResponse] = await Promise.all([
          getProperty(id),
          listBookmarks()
        ]);
        const nextProperty = propertyResponse.data.data.property;
        const bookmarkedIds = new Set(
          bookmarksResponse.data.data.bookmarks.map(getBookmarkPropertyId).filter(Boolean)
        );

        if (isMounted) {
          setProperty(nextProperty);
          setIsBookmarked(bookmarkedIds.has(nextProperty.id));
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

  const handleRecalculate = async () => {
    setError("");
    setStatusMessage("");
    setIsRecalculating(true);

    try {
      const response = await recalculatePropertyScore(id);

      setProperty(response.data.data.property);
      setStatusMessage("Deal score recalculated.");
    } catch (scoreError) {
      setError(getErrorMessage(scoreError, "Deal score could not be recalculated."));
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleBookmarkChange = (propertyId, nextBookmarked) => {
    if (propertyId === property?.id) {
      setIsBookmarked(nextBookmarked);
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
          <BookmarkButton
            isBookmarked={isBookmarked}
            onChange={handleBookmarkChange}
            propertyId={property.id}
          />
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
          <DealScoreBadge scoring={property.scoring} size="large" />
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

        <section className="property-detail-panel" aria-labelledby="scoring-title">
          <div className="panel-title-row">
            <h2 id="scoring-title">Deal scoring</h2>
            {canEdit ? (
              <button
                className="secondary-button"
                disabled={isRecalculating}
                onClick={handleRecalculate}
                type="button"
              >
                {isRecalculating ? "Recalculating..." : "Recalculate"}
              </button>
            ) : null}
          </div>
          <dl className="property-detail-list">
            <div>
              <dt>Category</dt>
              <dd>{formatCategory(property.scoring?.category)}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{formatPercent(property.scoring?.confidence)}</dd>
            </div>
            <div>
              <dt>ARV</dt>
              <dd>{formatMoney(property.scoring?.arv)}</dd>
            </div>
            <div>
              <dt>Rent</dt>
              <dd>{formatMoney({ amount: property.scoring?.rent?.monthly, currency: property.scoring?.rent?.currency })}/mo</dd>
            </div>
            <div>
              <dt>Annual rent</dt>
              <dd>{formatMoney({ amount: property.scoring?.rent?.annual, currency: property.scoring?.rent?.currency })}</dd>
            </div>
            <div>
              <dt>Gross yield</dt>
              <dd>{formatPercent(property.scoring?.grossYield)}</dd>
            </div>
            <div>
              <dt>ROI</dt>
              <dd>{formatPercent(property.scoring?.roi)}</dd>
            </div>
            <div>
              <dt>Risk score</dt>
              <dd>{formatNumber(property.scoring?.riskScore)}</dd>
            </div>
          </dl>
          {property.scoring?.notes ? <p className="muted-note">{property.scoring.notes}</p> : null}
        </section>

        <PropertyNotes currentUser={user} propertyId={property.id} />

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
