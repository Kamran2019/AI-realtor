const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const aiFeedbackSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["property_scoring", "defect_detection"],
      required: true,
      index: true,
    },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    inspectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Inspection" },
    modelVersion: String,
    aiPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    userCorrectionPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

aiFeedbackSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("AIFeedback", aiFeedbackSchema);

