const mongoose = require("mongoose");

const { Schema } = mongoose;

const propertyBookmarkSchema = new Schema(
  {
    userId: {
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

propertyBookmarkSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.model("PropertyBookmark", propertyBookmarkSchema);
