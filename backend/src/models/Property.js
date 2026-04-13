const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const propertyHistorySchema = new mongoose.Schema(
  {
    changedAt: { type: Date, default: Date.now },
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    sourceRunId: { type: mongoose.Schema.Types.ObjectId, ref: "ScrapeRun" },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sourceKey: { type: String, required: true, index: true },
    sourceListingId: { type: String, required: true, index: true },
    url: String,
    status: {
      type: String,
      enum: ["active", "under_offer", "sold", "withdrawn", "draft"],
      default: "active",
      index: true,
    },
    address: { type: String, required: true, trim: true },
    postcode: { type: String, trim: true, index: true },
    geo: {
      lat: Number,
      lng: Number,
    },
    type: String,
    tenure: String,
    description: String,
    guidePrice: { type: Number, default: 0 },
    auctionDate: Date,
    valuation: {
      arvEstimate: Number,
      monthlyRentEstimate: Number,
      refurbCostEstimate: Number,
      purchaseCostEstimate: Number,
    },
    scoring: {
      score: { type: Number, default: 0, index: true },
      yieldPct: { type: Number, default: 0, index: true },
      roiPct: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      modelVersion: { type: String, default: "deal-v1" },
      computedAt: Date,
    },
    risks: {
      redFlags: [{ type: String }],
      shortLease: { type: Boolean, default: false },
      floodRisk: { type: String, default: "unknown" },
      planningRestrictions: { type: String, default: "unknown" },
      summary: String,
    },
    legalPack: {
      pdfUrl: String,
      extractedText: String,
      parsedAt: Date,
    },
    images: [{ type: String }],
    history: [propertyHistorySchema],
  },
  { timestamps: true }
);

propertySchema.index({ sourceKey: 1, sourceListingId: 1 }, { unique: true });
propertySchema.index({ address: "text", postcode: "text", description: "text" });
propertySchema.plugin(toJSONPlugin);

module.exports = mongoose.model("Property", propertySchema);

