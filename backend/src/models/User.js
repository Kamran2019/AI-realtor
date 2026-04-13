const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: String,
    ip: String,
  },
  { _id: false, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: String,
    role: {
      type: String,
      enum: ["admin", "sub_admin", "user"],
      default: "admin",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    disabledAt: Date,
    providers: {
      local: {
        enabled: { type: Boolean, default: true },
      },
      google: {
        id: String,
        email: String,
      },
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: String,
    emailVerificationExpiresAt: Date,
    passwordResetTokenHash: String,
    passwordResetExpiresAt: Date,
    refreshTokens: [refreshTokenSchema],
    lastLoginAt: Date,
    settings: {
      timezone: { type: String, default: "UTC" },
      locale: { type: String, default: "en-GB" },
    },
    branding: {
      logoUrl: String,
      primaryColor: { type: String, default: "#159a8b" },
      footerText: String,
      companyName: String,
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "starter", "pro", "enterprise"],
        default: "free",
      },
      interval: {
        type: String,
        enum: ["monthly", "yearly", null],
        default: null,
      },
      status: {
        type: String,
        enum: [
          "free",
          "trialing",
          "active",
          "past_due",
          "canceled",
          "unpaid",
          "incomplete",
          "inactive",
        ],
        default: "free",
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      currentPeriodEnd: Date,
      trialEndsAt: Date,
      cancelAtPeriodEnd: { type: Boolean, default: false },
      lastInvoiceId: String,
      lastPaymentError: String,
    },
  },
  { timestamps: true }
);

userSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("User", userSchema);

