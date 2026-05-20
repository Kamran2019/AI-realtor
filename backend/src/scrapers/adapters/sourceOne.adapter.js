const buildUrl = (baseUrl, path) => new URL(path, baseUrl).toString();

const scrape = async (source) => [
  {
    sourceListingId: `${source.key}-lot-1`,
    url: buildUrl(source.baseUrl, `/${source.key}/lot-1`),
    address: {
      line1: "1 Market Street",
      city: "London",
      postcode: "SW1A 1AA",
      country: "UK"
    },
    price: 250000,
    currency: "GBP",
    type: "Flat",
    tenure: "Leasehold",
    description: `Sample property listing from ${source.name}.`
  }
];

module.exports = { scrape };
