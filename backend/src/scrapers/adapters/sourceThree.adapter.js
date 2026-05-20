const buildUrl = (baseUrl, path) => new URL(path, baseUrl).toString();

const scrape = async (source) => [
  {
    sourceListingId: `${source.key}-lot-1`,
    url: buildUrl(source.baseUrl, `/${source.key}/lot-1`),
    address: {
      line1: "14 Harbour Lane",
      city: "Bristol",
      postcode: "BS1 4ST",
      country: "UK"
    },
    price: 410000,
    currency: "GBP",
    type: "Maisonette",
    tenure: "Leasehold",
    description: `Source three listing from ${source.name}.`
  }
];

module.exports = { scrape };
