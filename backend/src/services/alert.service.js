const AlertRule = require("../models/AlertRule");
const Property = require("../models/Property");
const { createNotification } = require("./notification.service");

function propertyMatchesRule(property, rule) {
  const minScore = rule.criteria?.minScore ?? 0;
  const maxGuidePrice = rule.criteria?.maxGuidePrice ?? Number.MAX_SAFE_INTEGER;
  const minYieldPct = rule.criteria?.minYieldPct ?? 0;
  const postcodes = rule.criteria?.postcodes || [];

  const scoreMatch = (property.scoring?.score || 0) >= minScore;
  const priceMatch = (property.guidePrice || 0) <= maxGuidePrice;
  const yieldMatch = (property.scoring?.yieldPct || 0) >= minYieldPct;
  const postcodeMatch =
    !postcodes.length ||
    postcodes.some((postcode) =>
      String(property.postcode || "").toLowerCase().startsWith(postcode.toLowerCase())
    );

  return scoreMatch && priceMatch && yieldMatch && postcodeMatch;
}

async function evaluatePropertyAlerts(property) {
  const rules = await AlertRule.find({
    ownerUserId: property.ownerUserId,
    isEnabled: true,
  });

  for (const rule of rules) {
    if (!propertyMatchesRule(property, rule)) {
      continue;
    }

    await createNotification({
      ownerUserId: rule.ownerUserId,
      userId: rule.userId,
      type: "property_alert",
      title: "Property alert matched",
      message: `${property.address} matched alert "${rule.name}".`,
      data: {
        propertyId: property._id,
        ruleId: rule._id,
      },
      channels: rule.channels,
    });

    rule.lastTriggeredAt = new Date();
    await rule.save();
  }
}

async function runDailyAlertEvaluation() {
  const properties = await Property.find({
    updatedAt: {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  for (const property of properties) {
    await evaluatePropertyAlerts(property);
  }
}

module.exports = {
  evaluatePropertyAlerts,
  runDailyAlertEvaluation,
};

