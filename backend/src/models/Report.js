const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const reportSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["inspection", "property"],
      required: true,
      index: true,
    },
    inspectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Inspection" },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    storage: {
      diskPath: String,
      url: String,
      mimeType: String,
      fileName: String,
      fileSize: Number,
    },
    shareTokenHash: String,
    shareExpiresAt: Date,
    shareEnabled: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "ready", "failed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

reportSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("Report", reportSchema);

