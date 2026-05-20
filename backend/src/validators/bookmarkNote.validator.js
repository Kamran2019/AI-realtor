const { z } = require("zod");

const objectIdSchema = (fieldName) =>
  z
    .string({
      required_error: `${fieldName} is required`
    })
    .trim()
    .regex(/^[a-f\d]{24}$/i, `Invalid ${fieldName}`);

const propertyIdParamsSchema = z
  .object({
    propertyId: objectIdSchema("property ID")
  })
  .strict("Unknown fields are not allowed");

const noteIdParamsSchema = z
  .object({
    id: objectIdSchema("note ID")
  })
  .strict("Unknown fields are not allowed");

const noteBodySchema = z
  .object({
    text: z
      .string({
        required_error: "Note text is required"
      })
      .trim()
      .min(1, "Note text is required")
      .max(3000, "Note text must be at most 3000 characters")
  })
  .strict("Unknown fields are not allowed");

module.exports = {
  noteBodySchema,
  noteIdParamsSchema,
  propertyIdParamsSchema
};
