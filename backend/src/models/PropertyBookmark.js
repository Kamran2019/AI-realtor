const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const propertyBookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

propertyBookmarkSchema.index({ userId: 1, propertyId: 1 }, { unique: true });
propertyBookmarkSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("PropertyBookmark", propertyBookmarkSchema);

