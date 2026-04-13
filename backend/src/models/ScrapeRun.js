const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const scrapeRunSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScrapeSource",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "running", "success", "failed"],
      default: "queued",
      index: true,
    },
    stats: {
      fetched: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
    },
    logsUrl: String,
    errorMessage: String,
    startedAt: Date,
    finishedAt: Date,
  },
  { timestamps: true }
);

scrapeRunSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("ScrapeRun", scrapeRunSchema);

