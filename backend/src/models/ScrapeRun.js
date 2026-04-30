const mongoose = require("mongoose");

const { Schema } = mongoose;

const scrapeRunSchema = new Schema(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: "ScrapeSource",
      required: true,
      index: true
    },
    sourceKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 50
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      default: "queued"
    },
    startedAt: {
      type: Date,
      default: null
    },
    finishedAt: {
      type: Date,
      default: null
    },
    stats: {
      seen: {
        type: Number,
        min: 0,
        default: 0
      },
      created: {
        type: Number,
        min: 0,
        default: 0
      },
      updated: {
        type: Number,
        min: 0,
        default: 0
      },
      skipped: {
        type: Number,
        min: 0,
        default: 0
      },
      failed: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    error: {
      message: {
        type: String,
        trim: true,
        default: null
      },
      details: {
        type: Schema.Types.Mixed,
        default: null
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

scrapeRunSchema.index({ ownerUserId: 1, createdAt: -1 });

module.exports = mongoose.model("ScrapeRun", scrapeRunSchema);
