const { z } = require("zod");

const Property = require("../models/Property");
const ScrapeRun = require("../models/ScrapeRun");
const ScrapeSource = require("../models/ScrapeSource");
const { getAdapter } = require("../scrapers");
const { matchPropertyAndNotify } = require("./alert.service");
const { applyPropertyScore } = require("./dealScoring.service");
const ApiError = require("../utils/ApiError");

const runningSourceIds = new Set();

const optionalString = z
  .string()
  .trim()
  .transform((value) => sanitizeText(value))
  .nullable()
  .optional();

const nullableNumber = (numberSchema) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.union([z.null(), numberSchema])
  );

const listingSchema = z
  .object({
    sourceListingId: z
      .string({
        required_error: "sourceListingId is required"
      })
      .trim()
      .min(1, "sourceListingId is required")
      .max(160),
    url: z
      .string()
      .trim()
      .url("URL must be valid")
      .nullable()
      .optional(),
    address: z
      .object({
        line1: optionalString,
        line2: optionalString,
        city: optionalString,
        county: optionalString,
        postcode: optionalString,
        country: optionalString
      })
      .default({}),
    price: z
      .union([z.number().finite().nonnegative(), z.null()])
      .optional()
      .default(null),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .length(3)
      .optional()
      .default("GBP"),
    auctionDate: z.coerce.date().nullable().optional(),
    type: optionalString,
    tenure: optionalString,
    bedrooms: nullableNumber(z.coerce.number().int().nonnegative()).optional().default(null),
    floorAreaSqFt: nullableNumber(z.coerce.number().finite().nonnegative()).optional().default(null),
    images: z
      .array(
        z.object({
          url: z.string().trim().url("Image URL must be valid"),
          caption: optionalString
        })
      )
      .optional()
      .default([]),
    description: optionalString,
    legalPack: z
      .object({
        status: z.enum(["missing", "pending", "available", "reviewed"]).optional(),
        url: z.string().trim().url("Legal pack URL must be valid").nullable().optional(),
        notes: optionalString
      })
      .optional()
      .default({})
  })
  .passthrough();

const trackedFields = [
  "source.url",
  "address.line1",
  "address.line2",
  "address.city",
  "address.county",
  "address.postcode",
  "address.country",
  "prices.guide.amount",
  "prices.guide.currency",
  "auctionDate",
  "type",
  "tenure",
  "bedrooms",
  "floorAreaSqFt",
  "images",
  "description",
  "legalPack.status",
  "legalPack.url",
  "legalPack.notes"
];

function sanitizeText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const normalizeForCompare = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (value && typeof value.toString === "function" && value._bsontype === "ObjectId") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeForCompare);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((normalized, key) => {
        if (key !== "_id") {
          normalized[key] = normalizeForCompare(value[key]);
        }

        return normalized;
      }, {});
  }

  return value ?? null;
};

const valuesDiffer = (left, right) =>
  JSON.stringify(normalizeForCompare(left)) !== JSON.stringify(normalizeForCompare(right));

const buildPropertyPayload = ({ listing, now, source }) => ({
  ownerUserId: source.ownerUserId,
  source: {
    key: source.key,
    listingId: listing.sourceListingId,
    url: listing.url || null,
    scrapedAt: now
  },
  address: {
    line1: listing.address.line1 || null,
    line2: listing.address.line2 || null,
    city: listing.address.city || null,
    county: listing.address.county || null,
    postcode: listing.address.postcode || null,
    country: listing.address.country || "UK"
  },
  prices: {
    guide: {
      amount: listing.price ?? null,
      currency: listing.currency || "GBP"
    }
  },
  auctionDate: listing.auctionDate || null,
  type: listing.type || null,
  tenure: listing.tenure || null,
  bedrooms: listing.bedrooms ?? null,
  floorAreaSqFt: listing.floorAreaSqFt ?? null,
  images: listing.images,
  description: listing.description || null,
  legalPack: {
    status: listing.legalPack.status || "missing",
    url: listing.legalPack.url || null,
    notes: listing.legalPack.notes || null
  }
});

const collectChanges = (property, payload) =>
  trackedFields.reduce((changes, field) => {
    const currentValue = property.get(field);
    const nextValue = field.split(".").reduce((value, key) => value?.[key], payload);

    if (valuesDiffer(currentValue, nextValue)) {
      changes.push({
        field,
        previousValue: normalizeForCompare(currentValue),
        newValue: normalizeForCompare(nextValue)
      });
    }

    return changes;
  }, []);

const normalizeListing = (rawListing) => {
  const floorArea = rawListing.floorArea;
  const floorAreaSqFt =
    rawListing.floorAreaSqFt ??
    (typeof floorArea === "object" ? floorArea.sqFt ?? floorArea.squareFeet ?? null : floorArea) ??
    (rawListing.floorAreaSqM ? Number(rawListing.floorAreaSqM) * 10.764 : null);
  const candidate = {
    ...rawListing,
    bedrooms: rawListing.bedrooms ?? rawListing.beds ?? rawListing.bedroomCount ?? null,
    floorAreaSqFt,
    price:
      rawListing.price && typeof rawListing.price === "object"
        ? rawListing.price.amount ?? null
        : rawListing.price ?? rawListing.guidePrice ?? null
  };

  return listingSchema.parse(candidate);
};

const safelyApplyScore = (property) => {
  try {
    applyPropertyScore(property);
  } catch (error) {
    return false;
  }

  return true;
};

const safelyMatchAlerts = async (property) => {
  try {
    await matchPropertyAndNotify({ property });
  } catch (error) {
    return false;
  }

  return true;
};

const updateSourceHealth = async ({ errorMessage = null, source, status }) => {
  source.health.lastStatus = status;
  source.health.lastCheckedAt = new Date();
  source.health.lastError = errorMessage;
  source.health.consecutiveFailures =
    status === "failed" ? (source.health.consecutiveFailures || 0) + 1 : 0;
  await source.save();
};

const processListing = async ({ rawListing, run, source, stats }) => {
  const now = new Date();
  const listing = normalizeListing(rawListing);
  const payload = buildPropertyPayload({ listing, now, source });
  const property = await Property.findOne({
    ownerUserId: source.ownerUserId,
    "source.key": source.key,
    "source.listingId": listing.sourceListingId
  });

  if (!property) {
    const newProperty = new Property({
      ...payload,
      history: [
        {
          eventType: "scrape_created",
          occurredAt: now,
          details: {
            runId: run._id,
            sourceId: source._id
          }
        }
      ]
    });
    safelyApplyScore(newProperty);
    await newProperty.save();
    await safelyMatchAlerts(newProperty);
    stats.created += 1;
    return;
  }

  const changes = collectChanges(property, payload);
  property.set("source.scrapedAt", now);

  if (!changes.length) {
    safelyApplyScore(property);
    await property.save();
    stats.skipped += 1;
    return;
  }

  trackedFields.forEach((field) => {
    const nextValue = field.split(".").reduce((value, key) => value?.[key], payload);
    property.set(field, nextValue);
  });
  property.history.push({
    eventType: "scrape_changed",
    occurredAt: now,
    details: {
      runId: run._id,
      sourceId: source._id,
      changes
    }
  });
  safelyApplyScore(property);
  await property.save();
  await safelyMatchAlerts(property);
  stats.updated += 1;
};

const runSource = async ({ ownerUserId, sourceId }) => {
  const source = await ScrapeSource.findOne({ _id: sourceId, ownerUserId });

  if (!source) {
    throw new ApiError(404, "Scrape source not found.");
  }

  const lockKey = source._id.toString();

  if (runningSourceIds.has(lockKey)) {
    throw new ApiError(409, "A scrape run is already running for this source.");
  }

  const existingRun = await ScrapeRun.exists({
    ownerUserId,
    sourceId: source._id,
    status: "running"
  });

  if (existingRun) {
    throw new ApiError(409, "A scrape run is already running for this source.");
  }

  runningSourceIds.add(lockKey);

  const run = await ScrapeRun.create({
    ownerUserId,
    sourceId: source._id,
    sourceKey: source.key,
    status: "running",
    startedAt: new Date()
  });

  const stats = {
    seen: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0
  };

  try {
    const adapter = getAdapter(source.key);
    const listings = await adapter.scrape(source.toJSON());

    for (const rawListing of listings || []) {
      stats.seen += 1;

      try {
        await processListing({ rawListing, run, source, stats });
      } catch (listingError) {
        stats.failed += 1;
      }
    }

    run.status = "completed";
    run.finishedAt = new Date();
    run.stats = stats;
    await run.save();
    await updateSourceHealth({
      errorMessage: stats.failed ? `${stats.failed} listing(s) failed.` : null,
      source,
      status: stats.failed ? "warning" : "healthy"
    });
  } catch (error) {
    run.status = "failed";
    run.finishedAt = new Date();
    run.stats = stats;
    run.error = {
      message: error.message,
      details: error.details || null
    };
    await run.save();
    await updateSourceHealth({
      errorMessage: error.message,
      source,
      status: "failed"
    });
  } finally {
    runningSourceIds.delete(lockKey);
  }

  return run.toJSON();
};

module.exports = {
  runSource,
  runningSourceIds
};
