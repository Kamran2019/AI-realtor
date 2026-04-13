const { stringify } = require("csv-stringify/sync");
const Property = require("../models/Property");
const PropertyBookmark = require("../models/PropertyBookmark");
const PropertyNote = require("../models/PropertyNote");
const Report = require("../models/Report");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { generatePropertyInvestmentPdf } = require("../services/pdf.service");
const { upsertPropertyFromListing } = require("../services/scraper.service");
const { calculatePropertyScore } = require("../services/property-scoring.service");
const { writeAuditLog } = require("../utils/audit");

function buildPropertyFilters(query, ownerUserId) {
  const filters = { ownerUserId };

  if (query.postcode) {
    filters.postcode = new RegExp(query.postcode, "i");
  }
  if (query.search) {
    filters.$text = { $search: query.search };
  }
  if (query.minPrice || query.maxPrice) {
    filters.guidePrice = {};
    if (query.minPrice) filters.guidePrice.$gte = Number(query.minPrice);
    if (query.maxPrice) filters.guidePrice.$lte = Number(query.maxPrice);
  }
  if (query.minScore) {
    filters["scoring.score"] = { $gte: Number(query.minScore) };
  }
  if (query.minYield) {
    filters["scoring.yieldPct"] = { $gte: Number(query.minYield) };
  }

  return filters;
}

const listProperties = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const filters = buildPropertyFilters(req.query, req.accountOwnerId);

  const [items, total] = await Promise.all([
    Property.find(filters)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit),
    Property.countDocuments(filters),
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!property) {
    throw new AppError("Property not found", 404);
  }

  const [bookmarked, notes, reports] = await Promise.all([
    PropertyBookmark.exists({ userId: req.user._id, propertyId: property._id }),
    PropertyNote.find({ propertyId: property._id }).sort({ createdAt: -1 }),
    Report.find({ ownerUserId: req.accountOwnerId, propertyId: property._id }),
  ]);

  res.json({
    property,
    bookmarked: !!bookmarked,
    notes,
    reports,
  });
});

const createProperty = asyncHandler(async (req, res) => {
  const source = {
    key: req.body.sourceKey || "manual",
  };
  const listing = {
    ...req.body,
    sourceListingId: req.body.sourceListingId || `manual-${Date.now()}`,
  };

  const result = await upsertPropertyFromListing({
    ownerUserId: req.accountOwnerId,
    source,
    listing,
    sourceRunId: null,
  });

  await writeAuditLog({
    actor: req.user,
    action: "property.create",
    targetType: "Property",
    targetId: listing.sourceListingId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    meta: { sourceKey: source.key },
  });

  res.status(201).json({
    message: "Property processed successfully",
    result,
  });
});

const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!property) {
    throw new AppError("Property not found", 404);
  }

  Object.assign(property, req.body);
  property.scoring = calculatePropertyScore(property);
  await property.save();

  await writeAuditLog({
    actor: req.user,
    action: "property.update",
    targetType: "Property",
    targetId: property._id.toString(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.json({ property });
});

const exportCsv = asyncHandler(async (req, res) => {
  const filters = buildPropertyFilters(req.query, req.accountOwnerId);
  const items = await Property.find(filters).sort({ createdAt: -1 });

  const csv = stringify(
    items.map((item) => ({
      address: item.address,
      postcode: item.postcode,
      guidePrice: item.guidePrice,
      score: item.scoring?.score,
      yieldPct: item.scoring?.yieldPct,
      roiPct: item.scoring?.roiPct,
      status: item.status,
    })),
    { header: true }
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="properties.csv"');
  res.send(csv);
});

const generatePdf = asyncHandler(async (req, res) => {
  const property = await Property.findOne({
    _id: req.params.id,
    ownerUserId: req.accountOwnerId,
  });
  if (!property) {
    throw new AppError("Property not found", 404);
  }

  const owner = await User.findById(req.accountOwnerId);
  const storage = await generatePropertyInvestmentPdf({
    property,
    branding: owner.branding,
  });

  const report = await Report.create({
    ownerUserId: req.accountOwnerId,
    createdByUserId: req.user._id,
    kind: "property",
    propertyId: property._id,
    storage,
    status: "ready",
  });

  res.json({ report });
});

module.exports = {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  exportCsv,
  generatePdf,
};

