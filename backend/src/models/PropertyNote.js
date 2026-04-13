const mongoose = require("mongoose");
const toJSONPlugin = require("../utils/toJSON");

const propertyNoteSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

propertyNoteSchema.plugin(toJSONPlugin);

module.exports = mongoose.model("PropertyNote", propertyNoteSchema);

