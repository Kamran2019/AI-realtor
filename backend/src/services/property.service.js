const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");

const NOT_FOUND_MESSAGE = "Property not found.";

const toJSON = (document) => document.toJSON();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sortPathMap = {
  auctionDate: "auctionDate",
  createdAt: "createdAt",
  guidePrice: "prices.guide.amount",
  postcode: "address.postcode",
  price: "prices.guide.amount",
  score: "scoring.total",
  updatedAt: "updatedAt",
  yield: "scoring.yieldScore"
};

const addRange = (filter, path, minValue, maxValue) => {
  if (minValue === undefined && maxValue === undefined) {
    return;
  }

  filter[path] = {
    ...(minValue !== undefined ? { $gte: minValue } : {}),
    ...(maxValue !== undefined ? { $lte: maxValue } : {})
  };
};

const endOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const buildPropertyFilter = (query) => {
  const filter = {
    ownerUserId: query.ownerUserId
  };

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { "address.line1": pattern },
      { "address.line2": pattern },
      { "address.city": pattern },
      { "address.county": pattern },
      { "address.postcode": pattern },
      { description: pattern },
      { "source.listingId": pattern },
      { type: pattern },
      { tenure: pattern },
      { tags: pattern }
    ];
  }

  if (query.postcode) {
    filter["address.postcode"] = new RegExp(escapeRegex(query.postcode), "i");
  }

  if (query.status) {
    filter.status = query.status.toLowerCase();
  }

  if (query.type) {
    filter.type = new RegExp(`^${escapeRegex(query.type)}$`, "i");
  }

  if (query.tenure) {
    filter.tenure = new RegExp(`^${escapeRegex(query.tenure)}$`, "i");
  }

  addRange(filter, "prices.guide.amount", query.minPrice, query.maxPrice);
  addRange(filter, "scoring.total", query.score ?? query.minScore, query.score ?? query.maxScore);
  addRange(filter, "scoring.yieldScore", query.yield ?? query.minYield, query.yield ?? query.maxYield);

  if (query.auctionDate) {
    filter.auctionDate = {
      $gte: query.auctionDate,
      $lte: endOfDay(query.auctionDate)
    };
  } else {
    addRange(
      filter,
      "auctionDate",
      query.auctionDateFrom,
      query.auctionDateTo ? endOfDay(query.auctionDateTo) : undefined
    );
  }

  return filter;
};

const listProperties = async (query) => {
  const filter = buildPropertyFilter(query);
  const skip = (query.page - 1) * query.limit;
  const sortPath = sortPathMap[query.sortBy];
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .sort({ [sortPath]: sortDirection, _id: sortDirection })
      .skip(skip)
      .limit(query.limit),
    Property.countDocuments(filter)
  ]);

  return {
    properties: properties.map(toJSON),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1
    }
  };
};

const listPropertiesForExport = async (query) => {
  const filter = buildPropertyFilter(query);
  const sortPath = sortPathMap[query.sortBy];
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  return Property.find(filter).sort({ [sortPath]: sortDirection, _id: sortDirection });
};

const findOwnedProperty = async ({ id, ownerUserId }) => {
  const property = await Property.findOne({ _id: id, ownerUserId });

  if (!property) {
    throw new ApiError(404, NOT_FOUND_MESSAGE);
  }

  return property;
};

const getProperty = async ({ id, ownerUserId }) => {
  const property = await findOwnedProperty({ id, ownerUserId });

  return toJSON(property);
};

const updateProperty = async ({ id, ownerUserId, updates }) => {
  const property = await findOwnedProperty({ id, ownerUserId });

  if (Object.prototype.hasOwnProperty.call(updates, "description")) {
    property.description = updates.description || null;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "status")) {
    property.status = updates.status;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "tags")) {
    property.tags = [...new Set(updates.tags)];
  }

  property.history.push({
    eventType: "dashboard_updated",
    occurredAt: new Date(),
    details: {
      fields: Object.keys(updates)
    }
  });

  await property.save();

  return toJSON(property);
};

module.exports = {
  buildPropertyFilter,
  getProperty,
  listPropertiesForExport,
  listProperties,
  updateProperty
};
