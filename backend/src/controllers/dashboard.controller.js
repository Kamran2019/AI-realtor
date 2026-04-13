const AlertRule = require("../models/AlertRule");
const Notification = require("../models/Notification");
const Property = require("../models/Property");
const Report = require("../models/Report");
const Inspection = require("../models/Inspection");
const ScrapeRun = require("../models/ScrapeRun");
const asyncHandler = require("../utils/asyncHandler");

const getDashboardSummary = asyncHandler(async (req, res) => {
  const [activeDeals, inspections, reports, alerts, unreadNotifications, scrapeRuns] =
    await Promise.all([
      Property.countDocuments({
        ownerUserId: req.accountOwnerId,
        status: "active",
      }),
      Inspection.countDocuments({ ownerUserId: req.accountOwnerId }),
      Report.countDocuments({ ownerUserId: req.accountOwnerId }),
      AlertRule.countDocuments({ ownerUserId: req.accountOwnerId }),
      Notification.countDocuments({
        userId: req.user._id,
        isRead: false,
      }),
      ScrapeRun.find({ ownerUserId: req.accountOwnerId })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

  res.json({
    cards: {
      activeDeals,
      inspections,
      reports,
      alerts,
      unreadNotifications,
    },
    recentScrapeRuns: scrapeRuns,
  });
});

module.exports = {
  getDashboardSummary,
};

