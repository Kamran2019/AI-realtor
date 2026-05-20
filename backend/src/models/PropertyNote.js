const mongoose = require("mongoose");

const { Schema } = mongoose;

const propertyNoteSchema = new Schema(
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
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 3000
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

propertyNoteSchema.index({ propertyId: 1, createdAt: -1 });
propertyNoteSchema.index({ userId: 1, propertyId: 1 });

module.exports = mongoose.model("PropertyNote", propertyNoteSchema);
