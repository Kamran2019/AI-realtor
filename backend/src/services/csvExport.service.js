const propertyService = require("./property.service");

const HEADERS = [
  "Listing ID",
  "Address",
  "City",
  "Postcode",
  "Status",
  "Type",
  "Tenure",
  "Guide Price",
  "Currency",
  "Auction Date",
  "Deal Score",
  "Yield Score",
  "Gross Yield",
  "Risk Flags",
  "Source URL"
];

const formatDate = (value) => (value ? new Date(value).toISOString() : "");

const formatMoneyAmount = (money) =>
  money?.amount === null || money?.amount === undefined ? "" : String(money.amount);

const formatAddress = (property) =>
  [
    property.address?.line1,
    property.address?.line2,
    property.address?.city,
    property.address?.county,
    property.address?.postcode
  ]
    .filter(Boolean)
    .join(", ");

const formatRisks = (property) =>
  (property.risks || [])
    .map((risk) => [risk.severity, risk.key].filter(Boolean).join(":"))
    .join("; ");

const escapeCsvCell = (value) => {
  const stringValue = value === null || value === undefined ? "" : String(value);

  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
};

const propertyToRow = (property) => [
  property.source?.listingId,
  formatAddress(property),
  property.address?.city,
  property.address?.postcode,
  property.status,
  property.type,
  property.tenure,
  formatMoneyAmount(property.prices?.guide),
  property.prices?.guide?.currency,
  formatDate(property.auctionDate),
  property.scoring?.total,
  property.scoring?.yieldScore,
  property.scoring?.grossYield,
  formatRisks(property),
  property.source?.url
];

const generatePropertyCsv = async (query) => {
  const properties = await propertyService.listPropertiesForExport(query);
  const rows = [HEADERS, ...properties.map(propertyToRow)];

  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`;
};

module.exports = {
  HEADERS,
  generatePropertyCsv
};
