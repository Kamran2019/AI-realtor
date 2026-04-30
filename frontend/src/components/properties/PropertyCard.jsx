import { Link } from "react-router-dom";

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

const PropertyCard = ({ property }) => {
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
          <strong>{formatMoney(property.prices?.guide)}</strong>
        </div>
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
            <dd>{property.scoring?.total ?? "TBC"}</dd>
          </div>
          <div>
            <dt>Yield</dt>
            <dd>{property.scoring?.yieldScore ?? "TBC"}</dd>
          </div>
        </dl>
        <div className="property-card-footer">
          <span>
            {[property.type, property.tenure].filter(Boolean).join(" / ") || "Property details TBC"}
          </span>
          <Link to={`/properties/${property.id}`}>View</Link>
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;
