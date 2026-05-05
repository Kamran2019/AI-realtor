const mongoose = require("mongoose");

const { Schema } = mongoose;

const reportFileSchema = new Schema(
  {
    key: {
      type: String,
      trim: true,
      default: null
    },
    mimeType: {
      type: String,
      trim: true,
      default: null
    },
    sizeBytes: {
      type: Number,
      min: 0,
      default: null
    }
  },
  { _id: false }
);

const reportSchema = new Schema(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["property_investor_pdf"],
      default: "property_investor_pdf",
      required: true
    },
    format: {
      type: String,
      enum: ["pdf"],
      default: "pdf",
      required: true
    },
    title: {
      type: String,
      trim: true,
      maxlength: 220,
      required: true
    },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
      index: true
    },
    file: {
      type: reportFileSchema,
      default: () => ({})
    },
    metadata: {
      propertyAddress: {
        type: String,
        trim: true,
        default: null
      },
      sourceUrl: {
        type: String,
        trim: true,
        default: null
      },
      dealScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null
      },
      riskCount: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    errorMessage: {
      type: String,
      trim: true,
      default: null
    },
    generatedAt: {
      type: Date,
      default: null
    },
    failedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.fileKey = ret.file?.key || null;
        ret.downloadUrl = ret.status === "ready" ? `/api/reports/${ret.id}/download` : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

reportSchema.index({ ownerUserId: 1, createdAt: -1 });
reportSchema.index({ ownerUserId: 1, type: 1, createdAt: -1 });
reportSchema.index({ ownerUserId: 1, propertyId: 1 });

module.exports = mongoose.model("Report", reportSchema);
