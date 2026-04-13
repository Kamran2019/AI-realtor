const axios = require("axios");
const pdfParse = require("pdf-parse");
const cron = require("node-cron");
const Property = require("../models/Property");
const ScrapeRun = require("../models/ScrapeRun");
const ScrapeSource = require("../models/ScrapeSource");
const { calculatePropertyScore } = require("./property-scoring.service");
const { evaluatePropertyAlerts } = require("./alert.service");
const parseSourceOne = require("./scrapers/sourceOne");
const parseSourceTwo = require("./scrapers/sourceTwo");
const parseSourceThree = require("./scrapers/sourceThree");

const parserMap = {
  source_one: parseSourceOne,
  source_two: parseSourceTwo,
  source_three: parseSourceThree,
};

const scheduledTasks = new Map();

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 AI Auction Property Analyzer",
    },
  });
  return response.data;
}

async function parseLegalPack(pdfUrl) {
  if (!pdfUrl) {
    return { pdfUrl: "", extractedText: "" };
  }

  try {
    const response = await axios.get(pdfUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
    });
    const parsed = await pdfParse(response.data);
    return {
      pdfUrl,
      extractedText: parsed.text?.slice(0, 10000) || "",
      parsedAt: new Date(),
    };
  } catch (_error) {
    return {
      pdfUrl,
      extractedText: "",
      parsedAt: new Date(),
    };
  }
}

function buildRiskFlags(legalPack = {}) {
  const extractedText = (legalPack.extractedText || "").toLowerCase();
  const redFlags = [];

  if (extractedText.includes("lease term") && extractedText.includes("years")) {
    redFlags.push("Review lease length in legal pack");
  }
  if (extractedText.includes("flood")) {
    redFlags.push("Potential flood risk reference found");
  }
  if (extractedText.includes("planning")) {
    redFlags.push("Planning restriction reference found");
  }

  return {
    redFlags,
    shortLease: extractedText.includes("less than 80 years"),
    floodRisk: extractedText.includes("flood") ? "review_required" : "unknown",
    planningRestrictions: extractedText.includes("planning")
      ? "review_required"
      : "unknown",
    summary: redFlags.join(", "),
  };
}

async function upsertPropertyFromListing({ ownerUserId, source, listing, sourceRunId }) {
  const legalPack = await parseLegalPack(listing.legalPack?.pdfUrl);
  const candidate = {
    ownerUserId,
    sourceKey: source.key,
    sourceListingId: listing.sourceListingId,
    url: listing.url,
    status: listing.status || "active",
    address: listing.address,
    postcode: listing.postcode,
    guidePrice: listing.guidePrice,
    auctionDate: listing.auctionDate,
    type: listing.type,
    tenure: listing.tenure,
    description: listing.description,
    valuation: listing.valuation || {},
    legalPack,
    risks: buildRiskFlags(legalPack),
  };

  candidate.scoring = calculatePropertyScore(candidate);

  const existing = await Property.findOne({
    sourceKey: source.key,
    sourceListingId: listing.sourceListingId,
  });

  if (!existing) {
    const created = await Property.create(candidate);
    await evaluatePropertyAlerts(created);
    return { created: 1, updated: 0, skipped: 0 };
  }

  const changedFields = {};
  ["guidePrice", "address", "postcode", "status", "url"].forEach((field) => {
    if (JSON.stringify(existing[field]) !== JSON.stringify(candidate[field])) {
      changedFields[field] = {
        from: existing[field],
        to: candidate[field],
      };
    }
  });

  Object.assign(existing, candidate);
  if (Object.keys(changedFields).length) {
    existing.history.push({
      changedAt: new Date(),
      fields: changedFields,
      sourceRunId,
    });
  }
  await existing.save();
  await evaluatePropertyAlerts(existing);

  return {
    created: 0,
    updated: Object.keys(changedFields).length ? 1 : 0,
    skipped: Object.keys(changedFields).length ? 0 : 1,
  };
}

async function runScrapeForSource(sourceId) {
  const source =
    typeof sourceId === "object" ? sourceId : await ScrapeSource.findById(sourceId);
  const parser = parserMap[source.key];

  if (!source || !parser) {
    throw new Error("Scrape source or parser not found");
  }

  const run = await ScrapeRun.create({
    ownerUserId: source.ownerUserId,
    sourceId: source._id,
    status: "running",
    startedAt: new Date(),
  });

  try {
    const html = await fetchHtml(source.baseUrl);
    const listings = parser(html, source);
    const totals = { fetched: listings.length, created: 0, updated: 0, skipped: 0 };

    for (const listing of listings) {
      const result = await upsertPropertyFromListing({
        ownerUserId: source.ownerUserId,
        source,
        listing,
        sourceRunId: run._id,
      });
      totals.created += result.created;
      totals.updated += result.updated;
      totals.skipped += result.skipped;
    }

    run.status = "success";
    run.stats = totals;
    run.finishedAt = new Date();
    await run.save();

    source.health = {
      ...source.health,
      lastRunAt: new Date(),
      lastStatus: "success",
      lastError: "",
      successCount: (source.health?.successCount || 0) + 1,
      failureCount: source.health?.failureCount || 0,
      consecutiveFailures: 0,
    };
    await source.save();
    return run;
  } catch (error) {
    run.status = "failed";
    run.errorMessage = error.message;
    run.finishedAt = new Date();
    await run.save();

    source.health = {
      ...source.health,
      lastRunAt: new Date(),
      lastStatus: "failed",
      lastError: error.message,
      successCount: source.health?.successCount || 0,
      failureCount: (source.health?.failureCount || 0) + 1,
      consecutiveFailures: (source.health?.consecutiveFailures || 0) + 1,
    };
    await source.save();
    throw error;
  }
}

async function scheduleSource(source) {
  if (!source.enabled) {
    return;
  }

  if (scheduledTasks.has(source.id)) {
    scheduledTasks.get(source.id).stop();
  }

  const task = cron.schedule(source.scheduleCron, async () => {
    await runScrapeForSource(source._id);
  });
  scheduledTasks.set(source.id, task);
}

async function refreshScrapeSchedules() {
  for (const [sourceId, task] of scheduledTasks.entries()) {
    const exists = await ScrapeSource.exists({ _id: sourceId, enabled: true });
    if (!exists) {
      task.stop();
      scheduledTasks.delete(sourceId);
    }
  }

  const sources = await ScrapeSource.find({ enabled: true });
  sources.forEach((source) => scheduleSource(source));
}

async function bootstrapDefaultScrapeSources(ownerUserId) {
  const defaults = [
    {
      ownerUserId,
      key: "source_one",
      baseUrl: "https://example.com/source-one",
      scheduleCron: "0 */12 * * *",
      enabled: false,
    },
    {
      ownerUserId,
      key: "source_two",
      baseUrl: "https://example.com/source-two",
      scheduleCron: "30 */12 * * *",
      enabled: false,
    },
    {
      ownerUserId,
      key: "source_three",
      baseUrl: "https://example.com/source-three",
      scheduleCron: "15 */12 * * *",
      enabled: false,
    },
  ];

  for (const source of defaults) {
    const exists = await ScrapeSource.findOne({
      ownerUserId,
      key: source.key,
    });
    if (!exists) {
      await ScrapeSource.create(source);
    }
  }
}

module.exports = {
  runScrapeForSource,
  refreshScrapeSchedules,
  bootstrapDefaultScrapeSources,
  upsertPropertyFromListing,
};
