const { getPlan } = require("../config/plans");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "checkout_completed"]);

const getUserPlan = (user) => getPlan(user?.subscription?.plan);

const requireActiveSubscription = (allowedPlans = []) =>
  asyncHandler(async (req, res, next) => {
    const userPlan = req.user?.subscription?.plan || "free";
    const status = req.user?.subscription?.status || "inactive";
    const planAllowed = allowedPlans.length === 0 || allowedPlans.includes(userPlan);

    if (!planAllowed || !ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
      throw new ApiError(403, "Your plan does not include this feature.");
    }

    next();
  });

const enforcePlanLimit = (limitName, getCurrentUsage) =>
  asyncHandler(async (req, res, next) => {
    const plan = getUserPlan(req.user);
    const limit = plan.limits?.[limitName];

    if (limit === null || limit === undefined) {
      next();
      return;
    }

    const currentUsage = await getCurrentUsage(req);

    if (currentUsage >= limit) {
      throw new ApiError(403, "Plan limit reached.");
    }

    next();
  });

module.exports = {
  enforcePlanLimit,
  requireActiveSubscription
};
