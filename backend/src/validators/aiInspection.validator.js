const { z } = require("zod");

const objectIdSchema = (fieldName) =>
  z
    .string({
      required_error: `${fieldName} is required`
    })
    .trim()
    .regex(/^[a-f\d]{24}$/i, `Invalid ${fieldName}`);

const aiImageDetectionParamsSchema = z
  .object({
    inspectionId: objectIdSchema("inspection ID"),
    roomId: objectIdSchema("room ID"),
    imageIndex: z.coerce.number().int("Image index must be an integer").min(0, "Image index must be at least 0")
  })
  .strict("Unknown fields are not allowed");

module.exports = {
  aiImageDetectionParamsSchema
};
