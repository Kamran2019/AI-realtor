const ScrapeRun = require("../models/ScrapeRun");
const ScrapeSource = require("../models/ScrapeSource");
const ApiError = require("../utils/ApiError");

const DUPLICATE_KEY_MESSAGE = "A scrape source with this key already exists.";
const NOT_FOUND_MESSAGE = "Scrape source not found.";

const toJSON = (document) => document.toJSON();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSourceFilter = ({ isEnabled, ownerUserId, search }) => {
  const filter = { ownerUserId };

  if (typeof isEnabled === "boolean") {
    filter.isEnabled = isEnabled;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");

    filter.$or = [{ key: pattern }, { name: pattern }, { baseUrl: pattern }];
  }

  return filter;
};

const listSources = async ({ ownerUserId, page, limit, search, isEnabled }) => {
  const filter = buildSourceFilter({ isEnabled, ownerUserId, search });
  const skip = (page - 1) * limit;
  const [sources, total] = await Promise.all([
    ScrapeSource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ScrapeSource.countDocuments(filter)
  ]);

  return {
    sources: sources.map(toJSON),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

const ensureUniqueKey = async ({ excludedSourceId = null, key, ownerUserId }) => {
  const query = {
    key,
    ownerUserId,
    ...(excludedSourceId ? { _id: { $ne: excludedSourceId } } : {})
  };
  const existingSource = await ScrapeSource.exists(query);

  if (existingSource) {
    throw new ApiError(409, DUPLICATE_KEY_MESSAGE);
  }
};

const createSource = async (ownerUserId, payload) => {
  await ensureUniqueKey({ key: payload.key, ownerUserId });

  try {
    const source = await ScrapeSource.create({
      ...payload,
      ownerUserId
    });

    return toJSON(source);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, DUPLICATE_KEY_MESSAGE);
    }

    throw error;
  }
};

const findOwnedSource = async ({ id, ownerUserId }) => {
  const source = await ScrapeSource.findOne({ _id: id, ownerUserId });

  if (!source) {
    throw new ApiError(404, NOT_FOUND_MESSAGE);
  }

  return source;
};

const updateSource = async ({ id, ownerUserId, updates }) => {
  const source = await findOwnedSource({ id, ownerUserId });

  if (updates.key && updates.key !== source.key) {
    await ensureUniqueKey({ excludedSourceId: source._id, key: updates.key, ownerUserId });
  }

  for (const [field, value] of Object.entries(updates)) {
    source.set(field, value);
  }

  try {
    await source.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, DUPLICATE_KEY_MESSAGE);
    }

    throw error;
  }

  return toJSON(source);
};

const updateSourceStatus = async ({ id, isEnabled, ownerUserId }) => {
  const source = await findOwnedSource({ id, ownerUserId });

  source.isEnabled = isEnabled;
  await source.save();

  return toJSON(source);
};

const listRuns = async ({ limit, ownerUserId, page }) => {
  const filter = { ownerUserId };
  const skip = (page - 1) * limit;
  const [runs, total] = await Promise.all([
    ScrapeRun.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ScrapeRun.countDocuments(filter)
  ]);

  return {
    runs: runs.map(toJSON),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

module.exports = {
  createSource,
  listRuns,
  listSources,
  updateSource,
  updateSourceStatus
};
