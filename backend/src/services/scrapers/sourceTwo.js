const cheerio = require("cheerio");

function parseSourceTwo(html, source) {
  const $ = cheerio.load(html);
  const items = [];

  $("article, .listing, .auction-lot").each((index, element) => {
    const address = $(element).find("h2, h3, .address").first().text().trim();
    const priceText = $(element).text().match(/£?([\d,]+)/);
    const link = $(element).find("a").first().attr("href");

    if (!address) {
      return;
    }

    items.push({
      sourceListingId: `${source.key}-${index + 1}`,
      address,
      postcode: "",
      guidePrice: Number((priceText?.[1] || "0").replace(/,/g, "")),
      url: link,
      type: "auction",
    });
  });

  return items;
}

module.exports = parseSourceTwo;

