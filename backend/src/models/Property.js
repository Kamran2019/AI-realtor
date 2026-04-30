const mongoose = require("mongoose");

const { Schema } = mongoose;

const moneySchema = new Schema(
  {
    amount: {
      type: Number,
      min: 0,
      default: null
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
      default: "GBP"
    }
  },
  { _id: false }
);

const propertySchema = new Schema(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    source: {
      key: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 50
      },
      listingId: {
        type: String,
        trim: true,
        maxlength: 160,
        default: null
      },
      url: {
        type: String,
        trim: true,
        default: null
      },
      scrapedAt: {
        type: Date,
        default: null
      }
    },
    address: {
      line1: {
        type: String,
        trim: true,
        maxlength: 180,
        default: null
      },
      line2: {
        type: String,
        trim: true,
        maxlength: 180,
        default: null
      },
      city: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null
      },
      county: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null
      },
      postcode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 20,
        default: null
      },
      country: {
        type: String,
        trim: true,
        maxlength: 80,
        default: "UK"
      }
    },
    geo: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator(value) {
            return value === undefined || value.length === 2;
          },
          message: "Coordinates must contain longitude and latitude"
        }
      }
    },
    prices: {
      guide: {
        type: moneySchema,
        default: () => ({})
      },
      reserve: {
        type: moneySchema,
        default: () => ({})
      },
      estimatedMarketValue: {
        type: moneySchema,
        default: () => ({})
      }
    },
    auctionDate: {
      type: Date,
      default: null
    },
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
    },
    images: [
      {
        url: {
          type: String,
          trim: true,
          required: true
        },
        caption: {
          type: String,
          trim: true,
          maxlength: 160,
          default: null
        }
      }
    ],
    description: {
      type: String,
      trim: true,
      default: null
    },
    history: [
      {
        eventType: {
          type: String,
          trim: true,
          maxlength: 80,
          required: true
        },
        occurredAt: {
          type: Date,
          default: Date.now
        },
        details: {
          type: Schema.Types.Mixed,
          default: null
        }
      }
    ],
    scoring: {
      total: {
        type: Number,
        min: 0,
        max: 100,
        default: null
      },
      yieldScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null
      },
      riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null
      },
      notes: {
        type: String,
        trim: true,
        default: null
      }
    },
    risks: [
      {
        key: {
          type: String,
          trim: true,
          maxlength: 80,
          required: true
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium"
        },
        note: {
          type: String,
          trim: true,
          default: null
        }
      }
    ],
    legalPack: {
      status: {
        type: String,
        enum: ["missing", "pending", "available", "reviewed"],
        default: "missing"
      },
      url: {
        type: String,
        trim: true,
        default: null
      },
      reviewedAt: {
        type: Date,
        default: null
      },
      notes: {
        type: String,
        trim: true,
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

propertySchema.index({ "geo.coordinates": "2dsphere" });
propertySchema.index({ ownerUserId: 1, "source.key": 1, "source.listingId": 1 }, { sparse: true });

module.exports = mongoose.model("Property", propertySchema);
