const mongoose = require("mongoose");

const { Schema } = mongoose;

const defectTypes = [
  "crack",
  "damp",
  "mould",
  "poor_finish",
  "structural_issue",
  "peeling_paint",
  "water_seepage",
  "stain",
  "wall_hole",
  "tile_damage",
  "manual_other"
];

const defectSources = ["manual", "ai_stub", "ai_microservice"];
const defectSeverities = ["low", "medium", "high"];
const inspectionStatuses = ["draft", "in_progress", "completed", "archived"];

const defectBoxSchema = new Schema(
  {
    x: {
      type: Number,
      default: null
    },
    y: {
      type: Number,
      default: null
    },
    w: {
      type: Number,
      default: null
    },
    h: {
      type: Number,
      default: null
    }
  },
  { _id: false }
);

const defectSchema = new Schema(
  {
    type: {
      type: String,
      enum: defectTypes,
      required: true
    },
    source: {
      type: String,
      enum: defectSources,
      default: "manual",
      required: true
    },
    severity: {
      type: String,
      enum: defectSeverities,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: ""
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null
    },
    box: {
      type: defectBoxSchema,
      default: null
    },
    modelVersion: {
      type: String,
      trim: true,
      default: null
    },
    reviewedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const roomSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 80,
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: ""
    },
    mediaUrls: [
      {
        type: String,
        trim: true
      }
    ],
    defects: [defectSchema]
  },
  { timestamps: true }
);

const inspectionSchema = new Schema(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    assignedToUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: inspectionStatuses,
      default: "draft",
      required: true
    },
    propertyRef: {
      propertyId: {
        type: Schema.Types.ObjectId,
        ref: "Property",
        default: null
      },
      address: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null
      },
      postcode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 12,
        default: null
      }
    },
    client: {
      name: {
        type: String,
        trim: true,
        maxlength: 120,
        default: null
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 320,
        default: null
      },
      phone: {
        type: String,
        trim: true,
        maxlength: 30,
        default: null
      }
    },
    capturedAt: {
      type: Date,
      default: null
    },
    geo: {
      lat: {
        type: Number,
        min: -90,
        max: 90,
        default: null
      },
      lng: {
        type: Number,
        min: -180,
        max: 180,
        default: null
      }
    },
    summary: {
      totalDefects: {
        type: Number,
        min: 0,
        default: 0
      },
      high: {
        type: Number,
        min: 0,
        default: 0
      },
      medium: {
        type: Number,
        min: 0,
        default: 0
      },
      low: {
        type: Number,
        min: 0,
        default: 0
      },
      notes: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: ""
      }
    },
    rooms: [roomSchema],
    recommendations: [
      {
        type: String,
        trim: true,
        maxlength: 1000
      }
    ],
    report: {
      lastGeneratedAt: {
        type: Date,
        default: null
      },
      latestReportId: {
        type: Schema.Types.ObjectId,
        ref: "Report",
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

        if (Array.isArray(ret.rooms)) {
          ret.rooms = ret.rooms.map((room) => {
            room.id = room._id.toString();
            delete room._id;

            if (Array.isArray(room.defects)) {
              room.defects = room.defects.map((defect) => {
                defect.id = defect._id.toString();
                delete defect._id;
                delete defect.__v;

                return defect;
              });
            }

            return room;
          });
        }

        return ret;
      }
    }
  }
);

inspectionSchema.index({ ownerUserId: 1, status: 1, createdAt: -1 });
inspectionSchema.index({ ownerUserId: 1, assignedToUserId: 1, status: 1 });
inspectionSchema.index({ ownerUserId: 1, createdByUserId: 1, createdAt: -1 });
inspectionSchema.index({ "propertyRef.propertyId": 1 });

module.exports = mongoose.model("Inspection", inspectionSchema);
module.exports.defectSeverities = defectSeverities;
module.exports.defectSources = defectSources;
module.exports.defectTypes = defectTypes;
module.exports.inspectionStatuses = inspectionStatuses;
