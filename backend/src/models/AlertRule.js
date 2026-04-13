const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const alertRuleSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    criteria: {
      minScore: Number,
      maxGuidePrice: Number,
      minYieldPct: Number,
      postcodes: [{ type: String }],
    },
    channels: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    isEnabled: { type: Boolean, default: true },
    lastTriggeredAt: Date,
  },
  { timestamps: true }
);

alertRuleSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("AlertRule", alertRuleSchema);

