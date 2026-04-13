const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const scrapeSourceSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    key: { type: String, required: true, trim: true },
    baseUrl: { type: String, required: true, trim: true },
    scheduleCron: { type: String, default: "0 */12 * * *" },
    enabled: { type: Boolean, default: true },
    parserConfig: {
      listSelector: String,
      titleSelector: String,
      priceSelector: String,
      linkSelector: String,
      postcodeSelector: String,
    },
    health: {
      lastRunAt: Date,
      lastStatus: {
        type: String,
        enum: ["idle", "success", "failed"],
        default: "idle",
      },
      lastError: String,
      successCount: { type: Number, default: 0 },
      failureCount: { type: Number, default: 0 },
      consecutiveFailures: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

scrapeSourceSchema.index({ ownerUserId: 1, key: 1 }, { unique: true });
scrapeSourceSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("ScrapeSource", scrapeSourceSchema);

