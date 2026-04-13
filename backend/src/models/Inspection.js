const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const annotationSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    label: String,
  },
  { _id: false }
);

const photoSchema = new mongoose.Schema(
  {
    storageKey: String,
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const defectSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["crack", "damp", "mould", "finish", "other"],
      default: "other",
    },
    title: String,
    description: String,
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    confidence: { type: Number, default: 0 },
    notes: String,
    manualOverride: { type: Boolean, default: false },
    annotations: [annotationSchema],
    images: [photoSchema],
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    notes: String,
    photos: [photoSchema],
    defects: [defectSchema],
  },
  { _id: false }
);

const inspectionSchema = new mongoose.Schema(
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
    assignedToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    status: {
      type: String,
      enum: ["draft", "in_progress", "finalized"],
      default: "draft",
      index: true,
    },
    propertyRef: {
      address: String,
      postcode: String,
      externalUrl: String,
    },
    rooms: [roomSchema],
    defects: [defectSchema],
    summary: {
      totalDefects: { type: Number, default: 0 },
      lowCount: { type: Number, default: 0 },
      mediumCount: { type: Number, default: 0 },
      highCount: { type: Number, default: 0 },
      criticalCount: { type: Number, default: 0 },
    },
    recommendations: [{ type: String }],
    geo: {
      lat: Number,
      lng: Number,
    },
    client: {
      name: String,
      email: String,
      phone: String,
    },
    completedAt: Date,
  },
  { timestamps: true }
);

inspectionSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("Inspection", inspectionSchema);

