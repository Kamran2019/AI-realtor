const buildUrl = (baseUrl, path) => new URL(path, baseUrl).toString();

const scrape = async (source) => [
  {
    sourceListingId: `${source.key}-lot-1`,
    url: buildUrl(source.baseUrl, `/${source.key}/lot-1`),
    address: {
      line1: "22 Station Road",
      city: "Manchester",
      postcode: "M1 1AE",
      country: "UK"
    },
    price: 185000,
    currency: "GBP",
    type: "Terraced house",
    tenure: "Freehold",
    description: `Source two listing from ${source.name}.`
  },
  {
    sourceListingId: `${source.key}-lot-2`,
    url: buildUrl(source.baseUrl, `/${source.key}/lot-2`),
    address: {
      line1: "8 Castle View",
      city: "Leeds",
      postcode: "LS1 2AB",
      country: "UK"
    },
    price: 320000,
    currency: "GBP",
    type: "Semi-detached house",
    tenure: "Freehold",
    description: `Second source two listing from ${source.name}.`
  }
];

module.exports = { scrape };
