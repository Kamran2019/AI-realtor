const AlertRule = require("../models/AlertRule");
const { getPlan } = require("../config/plans");
const notificationService = require("./notification.service");
const ApiError = require("../utils/ApiError");

const NOT_FOUND_MESSAGE = "Alert rule not found.";

const toJSON = (document) => document.toJSON();

const getPlanMaxAlerts = (user) => getPlan(user?.subscription?.plan).limits?.maxAlerts;

const normalizeCriteriaForStorage = (criteria) => ({
  maxPrice: criteria.maxPrice ?? null,
  maxScore: criteria.maxScore ?? null,
  maxYield: criteria.maxYield ?? null,
  minPrice: criteria.minPrice ?? null,
  minScore: criteria.minScore ?? null,
  minYield: criteria.minYield ?? null,
  postcodes: [...new Set(criteria.postcodes || [])],
  tenure: criteria.tenure || null,
  type: criteria.type || null
});

const enforceAlertLimit = async (user) => {
  const maxAlerts = getPlanMaxAlerts(user);

  if (maxAlerts === null || maxAlerts === undefined) {
    return;
  }

  const currentAlerts = await AlertRule.countDocuments({ userId: user._id });

  if (currentAlerts >= maxAlerts) {
    throw new ApiError(403, `Alert limit reached for your plan (${maxAlerts}).`);
  }
};

const listAlertRules = async ({ user }) => {
  const alertRules = await AlertRule.find({ userId: user._id }).sort({ createdAt: -1, _id: -1 });

  return alertRules.map(toJSON);
};

const createAlertRule = async ({ payload, user }) => {
  await enforceAlertLimit(user);

  const alertRule = await AlertRule.create({
    channels: payload.channels,
    criteria: normalizeCriteriaForStorage(payload.criteria),
    isEnabled: payload.isEnabled ?? true,
    name: payload.name,
    userId: user._id
  });

  return toJSON(alertRule);
};

const findOwnAlertRule = async ({ id, user }) => {
  const alertRule = await AlertRule.findOne({ _id: id, userId: user._id });

  if (!alertRule) {
    throw new ApiError(404, NOT_FOUND_MESSAGE);
  }

  return alertRule;
};

const updateAlertRule = async ({ id, payload, user }) => {
  const alertRule = await findOwnAlertRule({ id, user });

  if (payload.name !== undefined) {
    alertRule.name = payload.name;
  }

  if (payload.criteria !== undefined) {
    alertRule.criteria = normalizeCriteriaForStorage(payload.criteria);
  }

  if (payload.channels !== undefined) {
    alertRule.channels = payload.channels;
  }

  if (payload.isEnabled !== undefined) {
    alertRule.isEnabled = payload.isEnabled;
  }

  await alertRule.save();

  return toJSON(alertRule);
};

const deleteAlertRule = async ({ id, user }) => {
  const alertRule = await findOwnAlertRule({ id, user });

  await alertRule.deleteOne();

  return {
    id: alertRule._id.toString()
  };
};

const normalizeText = (value) =>
  value === null || value === undefined ? "" : String(value).trim().toLowerCase();

const normalizePostcode = (value) =>
  value === null || value === undefined
    ? ""
    : String(value).trim().replace(/\s+/g, " ").toUpperCase();

const numericMatches = ({ actual, max, min }) => {
  if ((min === null || min === undefined) && (max === null || max === undefined)) {
    return true;
  }

  if (actual === null || actual === undefined || Number.isNaN(Number(actual))) {
    return false;
  }

  if (min !== null && min !== undefined && Number(actual) < min) {
    return false;
  }

  if (max !== null && max !== undefined && Number(actual) > max) {
    return false;
  }

  return true;
};

const postcodeMatches = ({ actual, postcodes = [] }) => {
  if (!postcodes.length) {
    return true;
  }

  const normalizedActual = normalizePostcode(actual);

  if (!normalizedActual) {
    return false;
  }

  return postcodes.some((postcode) => normalizedActual.startsWith(normalizePostcode(postcode)));
};

const propertyMatchesRule = ({ alertRule, property }) => {
  const criteria = alertRule.criteria || {};
  const yieldValue = property.scoring?.grossYield ?? property.scoring?.yieldScore;

  return (
    numericMatches({
      actual: property.scoring?.total,
      max: criteria.maxScore,
      min: criteria.minScore
    }) &&
    numericMatches({
      actual: property.prices?.guide?.amount,
      max: criteria.maxPrice,
      min: criteria.minPrice
    }) &&
    numericMatches({
      actual: yieldValue,
      max: criteria.maxYield,
      min: criteria.minYield
    }) &&
    postcodeMatches({
      actual: property.address?.postcode,
      postcodes: criteria.postcodes || []
    }) &&
    (!criteria.type || normalizeText(property.type) === normalizeText(criteria.type)) &&
    (!criteria.tenure || normalizeText(property.tenure) === normalizeText(criteria.tenure))
  );
};

const matchPropertyAndNotify = async ({ property }) => {
  const alertRules = await AlertRule.find({
    isEnabled: true,
    userId: property.ownerUserId
  });
  const matches = [];

  for (const alertRule of alertRules) {
    if (propertyMatchesRule({ alertRule, property })) {
      const result = await notificationService.createAlertNotification({
        alertRule,
        property
      });

      matches.push({
        alertRule: toJSON(alertRule),
        ...result
      });
    }
  }

  return matches;
};

module.exports = {
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  matchPropertyAndNotify,
  propertyMatchesRule,
  updateAlertRule
};
