const mongoose = require("mongoose");

const { Schema } = mongoose;

const alertCriteriaSchema = new Schema(
  {
    minScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    maxScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    minPrice: {
      type: Number,
      min: 0,
      default: null
    },
    maxPrice: {
      type: Number,
      min: 0,
      default: null
    },
    minYield: {
      type: Number,
      min: 0,
      default: null
    },
    maxYield: {
      type: Number,
      min: 0,
      default: null
    },
    postcodes: [
      {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 20
      }
    ],
    type: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null
    },
    tenure: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null
    }
  },
  { _id: false }
);

const alertRuleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    criteria: {
      type: alertCriteriaSchema,
      required: true,
      default: () => ({})
    },
    channels: [
      {
        type: String,
        enum: ["in_app", "email"],
        required: true
      }
    ],
    isEnabled: {
      type: Boolean,
      default: true,
      index: true
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

alertRuleSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("AlertRule", alertRuleSchema);
