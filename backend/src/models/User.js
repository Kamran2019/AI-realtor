const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 320
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    role: {
      type: String,
      enum: ["admin", "sub_admin", "user"],
      default: "user",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "disabled", "deleted"],
      default: "active",
      required: true
    },
    emailVerification: {
      isVerified: {
        type: Boolean,
        default: false
      },
      tokenHash: {
        type: String,
        default: null,
        select: false
      },
      expiresAt: {
        type: Date,
        default: null
      },
      verifiedAt: {
        type: Date,
        default: null
      }
    },
    passwordReset: {
      tokenHash: {
        type: String,
        default: null,
        select: false
      },
      expiresAt: {
        type: Date,
        default: null
      },
      requestedAt: {
        type: Date,
        default: null
      }
    },
    authProviders: {
      google: {
        googleId: {
          type: String,
          default: null,
          select: false
        },
        email: {
          type: String,
          default: null,
          trim: true,
          lowercase: true
        },
        connectedAt: {
          type: Date,
          default: null
        }
      }
    },
    subscription: {
      plan: {
        type: String,
        default: "free"
      },
      status: {
        type: String,
        default: "inactive"
      },
      stripeCustomerId: {
        type: String,
        default: null,
        select: false
      },
      stripeSubscriptionId: {
        type: String,
        default: null,
        select: false
      },
      currentPeriodEnd: {
        type: Date,
        default: null
      }
    },
    companyBranding: {
      companyName: {
        type: String,
        default: null,
        trim: true,
        maxlength: 120
      },
      logoUrl: {
        type: String,
        default: null,
        trim: true
      },
      primaryColor: {
        type: String,
        default: null,
        trim: true
      }
    },
    settings: {
      locale: {
        type: String,
        default: "en"
      },
      timezone: {
        type: String,
        default: "UTC"
      },
      emailNotifications: {
        type: Boolean,
        default: true
      }
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    gdpr: {
      termsAcceptedAt: {
        type: Date,
        default: null
      },
      privacyAcceptedAt: {
        type: Date,
        default: null
      },
      dataExportRequestedAt: {
        type: Date,
        default: null
      },
      deletionRequestedAt: {
        type: Date,
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
        delete ret.passwordHash;

        if (ret.emailVerification) {
          delete ret.emailVerification.tokenHash;
        }

        if (ret.passwordReset) {
          delete ret.passwordReset.tokenHash;
        }

        if (ret.authProviders?.google) {
          delete ret.authProviders.google.googleId;
        }

        if (ret.subscription) {
          delete ret.subscription.stripeCustomerId;
          delete ret.subscription.stripeSubscriptionId;
        }

        return ret;
      }
    }
  }
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2
    }
  }
);

module.exports = mongoose.model("User", userSchema);
