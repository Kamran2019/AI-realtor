function toJSONPlugin(schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      return ret;
    },
  });
}

module.exports = toJSONPlugin;

