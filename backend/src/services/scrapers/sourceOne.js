const cheerio = require("cheerio");

function parseSourceOne(html, source) {
  const $ = cheerio.load(html);
  const items = [];

  $(source.parserConfig?.listSelector || ".property-card").each((index, element) => {
    const title = $(element)
      .find(source.parserConfig?.titleSelector || ".title")
      .text()
      .trim();
    const priceText = $(element)
      .find(source.parserConfig?.priceSelector || ".price")
      .text()
      .replace(/[^\d.]/g, "");
    const href = $(element)
      .find(source.parserConfig?.linkSelector || "a")
      .attr("href");
    const postcode = $(element)
      .find(source.parserConfig?.postcodeSelector || ".postcode")
      .text()
      .trim();

    if (!title) {
      return;
    }

    items.push({
      sourceListingId: `${source.key}-${index + 1}`,
      address: title,
      postcode,
      guidePrice: Number(priceText || 0),
      url: href,
      type: "auction",
    });
  });

  return items;
}

module.exports = parseSourceOne;

