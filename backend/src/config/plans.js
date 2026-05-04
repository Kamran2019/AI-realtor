const PLAN_KEYS = ["starter", "pro", "enterprise"];
const BILLING_INTERVALS = ["monthly", "yearly"];

const plans = {
  free: {
    key: "free",
    name: "Free",
    limits: {
      activeListings: 3,
      maxAlerts: 3,
      inspectionsPerMonth: 0,
      teamMembers: 1
    },
    stripePrices: {}
  },
  starter: {
    key: "starter",
    name: "Starter",
    limits: {
      activeListings: 15,
      maxAlerts: 10,
      inspectionsPerMonth: 25,
      teamMembers: 2
    },
    stripePrices: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID
    }
  },
  pro: {
    key: "pro",
    name: "Pro",
    limits: {
      activeListings: 100,
      maxAlerts: 50,
      inspectionsPerMonth: 250,
      teamMembers: 10
    },
    stripePrices: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID
    }
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    limits: {
      activeListings: null,
      maxAlerts: null,
      inspectionsPerMonth: null,
      teamMembers: null
    },
    stripePrices: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID
    }
  }
};

const isPaidPlan = (plan) => PLAN_KEYS.includes(plan);

const getPlan = (plan = "free") => plans[plan] || plans.free;

const getPriceId = (plan, interval) => plans[plan]?.stripePrices?.[interval] || null;

const getPlanByPriceId = (priceId) => {
  if (!priceId) {
    return null;
  }

  for (const plan of PLAN_KEYS) {
    for (const interval of BILLING_INTERVALS) {
      if (plans[plan].stripePrices[interval] === priceId) {
        return { interval, plan };
      }
    }
  }

  return null;
};

module.exports = {
  BILLING_INTERVALS,
  PLAN_KEYS,
  getPlan,
  getPlanByPriceId,
  getPriceId,
  isPaidPlan,
  plans
};
