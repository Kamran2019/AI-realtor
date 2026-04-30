const { z } = require("zod");

const objectIdSchema = z
  .string({
    required_error: "Source ID is required"
  })
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid source ID");

const keySchema = z
  .string({
    required_error: "Key is required"
  })
  .trim()
  .toLowerCase()
  .min(2, "Key must be at least 2 characters")
  .max(50, "Key must be at most 50 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Key must be a lowercase slug");

const cronSchema = z
  .string({
    required_error: "Cron is required"
  })
  .trim()
  .regex(/^(\S+\s+){4}\S+$/, "Cron must be a valid 5-field expression");

const sourceIdParamsSchema = z
  .object({
    id: objectIdSchema
  })
  .strict("Unknown fields are not allowed");

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit must be at most 100")
      .default(20),
    search: z.string().trim().max(120, "Search must be at most 120 characters").optional(),
    isEnabled: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional()
  })
  .strict("Unknown fields are not allowed");

const createSourceSchema = z
  .object({
    key: keySchema,
    name: z
      .string({
        required_error: "Name is required"
      })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    baseUrl: z
      .string({
        required_error: "Base URL is required"
      })
      .trim()
      .url("Base URL must be valid"),
    cron: cronSchema,
    timezone: z
      .string({
        required_error: "Timezone is required"
      })
      .trim()
      .min(1, "Timezone is required")
      .max(80, "Timezone must be at most 80 characters"),
    isEnabled: z.boolean().optional()
  })
  .strict("Unknown fields are not allowed");

const updateSourceSchema = createSourceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

const updateSourceStatusSchema = z
  .object({
    isEnabled: z.boolean()
  })
  .strict("Unknown fields are not allowed");

module.exports = {
  createSourceSchema,
  listQuerySchema,
  sourceIdParamsSchema,
  updateSourceSchema,
  updateSourceStatusSchema
};
