const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const auditLogSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: String,
    ip: String,
    userAgent: String,
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("AuditLog", auditLogSchema);

