const mongoose = require("mongoose");

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    alertRuleId: {
      type: Schema.Types.ObjectId,
      ref: "AlertRule",
      default: null,
      index: true
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      default: null,
      index: true
    },
    type: {
      type: String,
      enum: ["alert_match"],
      default: "alert_match",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    channels: [
      {
        type: String,
        enum: ["in_app", "email"],
        required: true
      }
    ],
    readAt: {
      type: Date,
      default: null,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null
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

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
