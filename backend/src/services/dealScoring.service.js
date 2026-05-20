const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");

const RENT_BY_BEDROOMS = {
  0: 700,
  1: 900,
  2: 1200,
  3: 1500,
  4: 1850,
  5: 2200
};

const SEVERITY_PENALTIES = {
  high: 18,
  medium: 10,
  low: 4
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const round = (value, places = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
};

const getGuidePrice = (property) => property.prices?.guide?.amount ?? null;

const getCurrency = (property) => property.prices?.guide?.currency || "GBP";

const normalizeBedrooms = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return clamp(Math.round(Number(value)), 0, 20);
};

const inferBedroomsFromFloorArea = (floorAreaSqFt) => {
  if (!floorAreaSqFt) {
    return null;
  }

  if (floorAreaSqFt < 500) {
    return 1;
  }

  if (floorAreaSqFt < 800) {
    return 2;
  }

  if (floorAreaSqFt < 1100) {
    return 3;
  }

  return 4;
};

const estimateBedrooms = (property) =>
  normalizeBedrooms(property.bedrooms) || inferBedroomsFromFloorArea(property.floorAreaSqFt) || 2;

const estimateMonthlyRent = (bedrooms) => RENT_BY_BEDROOMS[Math.min(bedrooms, 5)] || RENT_BY_BEDROOMS[2];

const calculateRiskPenalty = (property) =>
  (property.risks || []).reduce(
    (penalty, risk) => penalty + (SEVERITY_PENALTIES[risk.severity] || SEVERITY_PENALTIES.medium),
    property.legalPack?.status === "missing" ? 6 : 0
  );

const calculateConfidence = (property) => {
  const checks = [
    getGuidePrice(property),
    property.bedrooms,
    property.floorAreaSqFt,
    property.tenure,
    property.auctionDate,
    property.legalPack?.status && property.legalPack.status !== "missing"
  ];

  const completed = checks.filter(Boolean).length;
  const riskAdjustment = property.risks?.length ? -8 : 0;

  return clamp(Math.round(35 + completed * 10 + riskAdjustment));
};

const categorizeScore = (score) => {
  if (score === null || score === undefined) {
    return "unknown";
  }

  if (score >= 80) {
    return "high_potential";
  }

  if (score >= 65) {
    return "solid";
  }

  if (score >= 45) {
    return "watch";
  }

  return "risky";
};

const unknownScore = (property, reason = "Guide price missing; scoring unavailable.") => ({
  total: null,
  yieldScore: null,
  riskScore: null,
  arv: {
    amount: null,
    currency: getCurrency(property)
  },
  rent: {
    monthly: null,
    annual: null,
    currency: getCurrency(property)
  },
  grossYield: null,
  roi: null,
  confidence: calculateConfidence(property),
  category: "unknown",
  calculatedAt: new Date(),
  notes: reason
});

const calculatePropertyScore = (property) => {
  const guidePrice = getGuidePrice(property);

  if (!guidePrice || guidePrice <= 0) {
    return unknownScore(property);
  }

  const currency = getCurrency(property);
  const bedrooms = estimateBedrooms(property);
  const monthlyRent = estimateMonthlyRent(bedrooms);
  const annualRent = monthlyRent * 12;
  const arvAmount = guidePrice * 1.15;
  const grossYield = (annualRent / guidePrice) * 100;
  const roi = ((arvAmount - guidePrice + annualRent) / guidePrice) * 100;
  const yieldScore = clamp(Math.round(grossYield * 10));
  const riskPenalty = calculateRiskPenalty(property);
  const riskScore = clamp(100 - riskPenalty);
  const confidence = calculateConfidence(property);
  const tenurePenalty = /leasehold/i.test(property.tenure || "") ? 4 : 0;
  const auctionPenalty = property.auctionDate && new Date(property.auctionDate) < new Date() ? 8 : 0;
  const rawScore =
    yieldScore * 0.38 +
    riskScore * 0.27 +
    roi * 1.2 +
    confidence * 0.15 -
    tenurePenalty -
    auctionPenalty;
  const total = clamp(Math.round(rawScore));

  return {
    total,
    yieldScore,
    riskScore,
    arv: {
      amount: round(arvAmount, 0),
      currency
    },
    rent: {
      monthly: monthlyRent,
      annual: annualRent,
      currency
    },
    grossYield: round(grossYield),
    roi: round(roi),
    confidence,
    category: categorizeScore(total),
    calculatedAt: new Date(),
    notes: riskPenalty
      ? `${riskPenalty} risk penalty point(s) applied.`
      : `Estimated using ${bedrooms} bedroom rent assumptions.`
  };
};

const applyPropertyScore = (property) => {
  property.scoring = calculatePropertyScore(property);
  return property;
};

const recalculatePropertyScore = async ({ id, ownerUserId }) => {
  const property = await Property.findOne({ _id: id, ownerUserId });

  if (!property) {
    throw new ApiError(404, "Property not found.");
  }

  applyPropertyScore(property);
  property.history.push({
    eventType: "score_recalculated",
    occurredAt: new Date(),
    details: {
      total: property.scoring.total,
      category: property.scoring.category
    }
  });

  await property.save();

  return property.toJSON();
};

module.exports = {
  applyPropertyScore,
  calculatePropertyScore,
  recalculatePropertyScore
};
