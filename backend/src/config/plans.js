const env = require("./env");

const PLAN_CONFIG = {
  free: {
    label: "Free",
    intervalOptions: [],
    features: {
      propertyBookmarks: 10,
      alertRules: 3,
      propertyReports: 3,
      inspections: 3,
      users: 1,
    },
  },
  starter: {
    label: "Starter",
    intervalOptions: ["monthly", "yearly"],
    prices: {
      monthly: env.stripeStarterMonthlyPriceId,
      yearly: env.stripeStarterYearlyPriceId,
    },
    features: {
      propertyBookmarks: 50,
      alertRules: 15,
      propertyReports: 20,
      inspections: 20,
      users: 5,
    },
  },
  pro: {
    label: "Pro",
    intervalOptions: ["monthly", "yearly"],
    prices: {
      monthly: env.stripeProMonthlyPriceId,
      yearly: env.stripeProYearlyPriceId,
    },
    features: {
      propertyBookmarks: 200,
      alertRules: 50,
      propertyReports: 100,
      inspections: 100,
      users: 25,
    },
  },
  enterprise: {
    label: "Enterprise",
    intervalOptions: ["monthly", "yearly"],
    prices: {
      monthly: env.stripeEnterpriseMonthlyPriceId,
      yearly: env.stripeEnterpriseYearlyPriceId,
    },
    features: {
      propertyBookmarks: -1,
      alertRules: -1,
      propertyReports: -1,
      inspections: -1,
      users: -1,
    },
  },
};

function getPlanConfig(plan = "free") {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.free;
}

function getPlanLimit(plan, featureKey) {
  return getPlanConfig(plan).features[featureKey] ?? 0;
}

function hasUnlimitedAccess(plan, featureKey) {
  return getPlanLimit(plan, featureKey) === -1;
}

function getPriceId(plan, interval) {
  const config = getPlanConfig(plan);
  return config.prices?.[interval];
}

module.exports = {
  PLAN_CONFIG,
  getPlanConfig,
  getPlanLimit,
  hasUnlimitedAccess,
  getPriceId,
};

