const AuditLog = require("../models/AuditLog");
const Property = require("../models/Property");
const Report = require("../models/Report");
const ScrapeRun = require("../models/ScrapeRun");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");

const getAdminDashboard = asyncHandler(async (req, res) => {
  const [userCount, propertyCount, reportCount, scrapeRunCount, auditCount, recentAuditLogs] =
    await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Report.countDocuments(),
      ScrapeRun.countDocuments(),
      AuditLog.countDocuments(),
      AuditLog.find({}).sort({ createdAt: -1, _id: -1 }).limit(8)
    ]);

  sendResponse(res, 200, {
    success: true,
    message: "Admin dashboard loaded.",
    data: {
      metrics: {
        users: userCount,
        properties: propertyCount,
        reports: reportCount,
        scrapeRuns: scrapeRunCount,
        auditLogs: auditCount
      },
      recentAuditLogs: recentAuditLogs.map((log) => log.toJSON())
    }
  });
});

module.exports = {
  getAdminDashboard
};
