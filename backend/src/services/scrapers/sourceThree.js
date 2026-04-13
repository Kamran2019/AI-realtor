const cheerio = require("cheerio");

function parseSourceThree(html, source) {
  const $ = cheerio.load(html);
  const items = [];

  $("li, .result, .property-row").each((index, element) => {
    const address = $(element).find(".address, .title, strong").first().text().trim();
    if (!address) {
      return;
    }

    items.push({
      sourceListingId: `${source.key}-${index + 1}`,
      address,
      postcode: $(element).find(".postcode").first().text().trim(),
      guidePrice: Number(
        ($(element).find(".price").first().text().replace(/[^\d]/g, "") || "0").trim()
      ),
      url: $(element).find("a").first().attr("href"),
      type: "auction",
    });
  });

  return items;
}

module.exports = parseSourceThree;

