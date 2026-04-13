const AuditLog = require("../models/AuditLog");
const { getAccountOwnerId } = require("./account");

async function writeAuditLog({
  actor,
  action,
  targetType,
  targetId,
  ip,
  userAgent,
  meta,
}) {
  if (!actor) {
    return null;
  }

  return AuditLog.create({
    ownerUserId: getAccountOwnerId(actor),
    actorUserId: actor._id,
    action,
    targetType,
    targetId,
    ip,
    userAgent,
    meta,
  });
}

module.exports = {
  writeAuditLog,
};

