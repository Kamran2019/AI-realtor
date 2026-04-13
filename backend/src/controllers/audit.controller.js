const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");

const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({
    ownerUserId: req.accountOwnerId,
  })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ items: logs });
});

module.exports = {
  listAuditLogs,
};

