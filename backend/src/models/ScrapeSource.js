const mongoose = require("mongoose");

const { Schema } = mongoose;

const scrapeSourceSchema = new Schema(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    baseUrl: {
      type: String,
      required: true,
      trim: true
    },
    cron: {
      type: String,
      required: true,
      trim: true
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    isEnabled: {
      type: Boolean,
      default: true
    },
    health: {
      lastStatus: {
        type: String,
        enum: ["unknown", "healthy", "warning", "failed"],
        default: "unknown"
      },
      lastCheckedAt: {
        type: Date,
        default: null
      },
      lastError: {
        type: String,
        trim: true,
        default: null
      },
      consecutiveFailures: {
        type: Number,
        min: 0,
        default: 0
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

scrapeSourceSchema.index({ ownerUserId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("ScrapeSource", scrapeSourceSchema);
