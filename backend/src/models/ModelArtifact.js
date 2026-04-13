const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const modelArtifactSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["deal_scoring", "defect_detection"],
      required: true,
      index: true,
    },
    version: { type: String, required: true },
    storage: {
      provider: { type: String, default: "local" },
      path: String,
      url: String,
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

modelArtifactSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("ModelArtifact", modelArtifactSchema);

