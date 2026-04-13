const ScrapeSource = require("../models/ScrapeSource");
const ScrapeRun = require("../models/ScrapeRun");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const {
  runScrapeForSource,
  refreshScrapeSchedules,
} = require("../services/scraper.service");
const { writeAuditLog } = require("../utils/audit");

const listSources = asyncHandler(async (req, res) => {
  const sources = await ScrapeSource.find({
    ownerUserId: req.accountOwnerId,
  }).sort({ createdAt: -1 });

  res.json({ items: sources });
});

const createSource = asyncHandler(async (req, res) => {
  const source = await ScrapeSource.findOneAndUpdate(
    {
      ownerUserId: req.accountOwnerId,
      key: req.body.key,
    },
    {
      ownerUserId: req.accountOwnerId,
      key: req.body.key,
      baseUrl: req.body.baseUrl,
      scheduleCron: req.body.scheduleCron,
      enabled: req.body.enabled ?? false,
      parserConfig: req.body.parserConfig || {},
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  await refreshScrapeSchedules();
  res.status(201).json({ source });
});

const updateSource = asyncHandler(async (req, res) => {
  const source = await ScrapeSource.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!source) {
    throw new AppError("Scrape source not found", 404);
  }

  Object.assign(source, {
    baseUrl: req.body.baseUrl ?? source.baseUrl,
    scheduleCron: req.body.scheduleCron ?? source.scheduleCron,
    enabled: req.body.enabled ?? source.enabled,
    parserConfig: req.body.parserConfig ?? source.parserConfig,
  });
  await source.save();
  await refreshScrapeSchedules();
  res.json({ source });
});

const deleteSource = asyncHandler(async (req, res) => {
  const source = await ScrapeSource.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!source) {
    throw new AppError("Scrape source not found", 404);
  }

  await source.deleteOne();
  await refreshScrapeSchedules();
  res.json({ message: "Scrape source deleted" });
});

const listRuns = asyncHandler(async (req, res) => {
  const filters = {
    ownerUserId: req.accountOwnerId,
  };
  if (req.query.sourceId) {
    filters.sourceId = req.query.sourceId;
  }

  const runs = await ScrapeRun.find(filters).sort({ createdAt: -1 }).limit(50);
  res.json({ items: runs });
});

const triggerRun = asyncHandler(async (req, res) => {
  const source = await ScrapeSource.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!source) {
    throw new AppError("Scrape source not found", 404);
  }

  const run = await runScrapeForSource(source);

  await writeAuditLog({
    actor: req.user,
    action: "scrape.run",
    targetType: "ScrapeSource",
    targetId: source._id.toString(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.json({ run });
});

module.exports = {
  listSources,
  createSource,
  updateSource,
  deleteSource,
  listRuns,
  triggerRun,
};
