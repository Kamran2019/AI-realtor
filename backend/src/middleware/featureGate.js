const AlertRule = require("../models/AlertRule");
const Inspection = require("../models/Inspection");
const PropertyBookmark = require("../models/PropertyBookmark");
const Report = require("../models/Report");
const User = require("../models/User");
const { getPlanLimit, hasUnlimitedAccess } = require("../config/plans");
const AppError = require("../utils/AppError");

const featureCounters = {
  propertyBookmarks: ({ user }) => PropertyBookmark.countDocuments({ userId: user._id }),
  alertRules: ({ accountOwnerId }) =>
    AlertRule.countDocuments({ ownerUserId: accountOwnerId }),
  propertyReports: ({ accountOwnerId }) =>
    Report.countDocuments({ ownerUserId: accountOwnerId, kind: "property" }),
  inspections: ({ accountOwnerId }) =>
    Inspection.countDocuments({ ownerUserId: accountOwnerId }),
  users: ({ accountOwnerId }) => User.countDocuments({ ownerUserId: accountOwnerId }),
};

function enforcePlanLimit(featureKey) {
  return async (req, _res, next) => {
    const owner = await User.findById(req.accountOwnerId);
    const plan = owner?.subscription?.plan || "free";

    if (hasUnlimitedAccess(plan, featureKey)) {
      return next();
    }

    const limit = getPlanLimit(plan, featureKey);
    const currentCount = await featureCounters[featureKey]({
      user: req.user,
      accountOwnerId: req.accountOwnerId,
    });

    if (currentCount >= limit) {
      return next(
        new AppError(
          `Your ${plan} plan has reached the limit for ${featureKey}. Upgrade to continue.`,
          403
        )
      );
    }

    next();
  };
}

module.exports = {
  enforcePlanLimit,
};

