const mongoose = require("mongoose");

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    actorRole: {
      type: String,
      enum: ["admin", "sub_admin", "user", "anonymous", "system"],
      default: "anonymous",
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
      index: true
    },
    entityType: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
      index: true
    },
    entityId: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
      index: true
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 400,
      default: null
    },
    meta: {
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

        if (ret.actorUserId?.toString) {
          ret.actorUserId = ret.actorUserId.toString();
        }

        return ret;
      }
    }
  }
);

auditLogSchema.index({ createdAt: -1, _id: -1 });
auditLogSchema.index({ actorUserId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
