import { Link } from "react-router-dom";
import BookmarkButton from "./BookmarkButton.jsx";
import DealScoreBadge from "./DealScoreBadge.jsx";

const formatMoney = (money) => {
  if (money?.amount === null || money?.amount === undefined) {
    return "Guide TBC";
  }

  return new Intl.NumberFormat("en-GB", {
    currency: money.currency || "GBP",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(money.amount);
};

const formatDate = (value) => {
  if (!value) {
    return "Auction date TBC";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
};

const formatCategory = (value) =>
  (value || "TBC")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const PropertyCard = ({ isBookmarked = false, onBookmarkChange, property }) => {
  const title = [property.address?.line1, property.address?.city]
    .filter(Boolean)
    .join(", ") || "Untitled property";
  const imageUrl = property.images?.[0]?.url;

  return (
    <article className="property-card">
      {imageUrl ? (
        <img alt={property.images[0]?.caption || title} className="property-card-image" src={imageUrl} />
      ) : (
        <div className="property-card-image placeholder" aria-hidden="true" />
      )}
      <div className="property-card-body">
        <div className="property-card-heading">
          <div>
            <span className="property-status">{property.status || "new"}</span>
            <h2>{title}</h2>
          </div>
          <DealScoreBadge scoring={property.scoring} />
        </div>
        <strong className="property-guide-price">{formatMoney(property.prices?.guide)}</strong>
        <dl className="property-facts">
          <div>
            <dt>Postcode</dt>
            <dd>{property.address?.postcode || "TBC"}</dd>
          </div>
          <div>
            <dt>Auction</dt>
            <dd>{formatDate(property.auctionDate)}</dd>
          </div>
          <div>
            <dt>Score</dt>
            <dd>{formatCategory(property.scoring?.category)}</dd>
          </div>
          <div>
            <dt>Yield</dt>
            <dd>{property.scoring?.grossYield ? `${property.scoring.grossYield}%` : "TBC"}</dd>
          </div>
        </dl>
        <div className="property-card-footer">
          <span>
            {[property.type, property.tenure].filter(Boolean).join(" / ") || "Property details TBC"}
          </span>
          <div className="property-card-actions">
            <BookmarkButton
              isBookmarked={isBookmarked}
              onChange={onBookmarkChange}
              propertyId={property.id}
            />
            <Link to={`/properties/${property.id}`}>View</Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;
