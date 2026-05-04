const { z } = require("zod");

const objectIdSchema = (fieldName) =>
  z
    .string({
      required_error: `${fieldName} is required`
    })
    .trim()
    .regex(/^[a-f\d]{24}$/i, `Invalid ${fieldName}`);

const optionalPercent = (fieldName) =>
  z
    .number({
      invalid_type_error: `${fieldName} must be a number`
    })
    .finite(`${fieldName} must be a number`)
    .min(0, `${fieldName} must be at least 0`)
    .max(100, `${fieldName} must be at most 100`)
    .nullable()
    .optional();

const optionalNonNegative = (fieldName) =>
  z
    .number({
      invalid_type_error: `${fieldName} must be a number`
    })
    .finite(`${fieldName} must be a number`)
    .min(0, `${fieldName} must be at least 0`)
    .nullable()
    .optional();

const optionalTrimmedString = (max, fieldName) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} cannot be empty`)
    .max(max, `${fieldName} must be at most ${max} characters`)
    .nullable()
    .optional();

const postcodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Postcode cannot be empty")
  .max(20, "Postcode must be at most 20 characters");

const hasCriteria = (criteria = {}) =>
  [
    criteria.minScore,
    criteria.maxScore,
    criteria.minPrice,
    criteria.maxPrice,
    criteria.minYield,
    criteria.maxYield,
    criteria.type,
    criteria.tenure
  ].some((value) => value !== undefined && value !== null && value !== "") ||
  Boolean(criteria.postcodes?.length);

const criteriaSchema = z
  .object({
    minScore: optionalPercent("Minimum score"),
    maxScore: optionalPercent("Maximum score"),
    minPrice: optionalNonNegative("Minimum price"),
    maxPrice: optionalNonNegative("Maximum price"),
    minYield: optionalNonNegative("Minimum yield"),
    maxYield: optionalNonNegative("Maximum yield"),
    postcodes: z.array(postcodeSchema).max(25, "At most 25 postcodes are allowed").optional(),
    type: optionalTrimmedString(80, "Type"),
    tenure: optionalTrimmedString(80, "Tenure")
  })
  .strict("Unknown fields are not allowed")
  .superRefine((criteria, context) => {
    const ranges = [
      ["minScore", "maxScore", "Minimum score cannot be greater than maximum score"],
      ["minPrice", "maxPrice", "Minimum price cannot be greater than maximum price"],
      ["minYield", "maxYield", "Minimum yield cannot be greater than maximum yield"]
    ];

    ranges.forEach(([minField, maxField, message]) => {
      if (
        criteria[minField] !== undefined &&
        criteria[minField] !== null &&
        criteria[maxField] !== undefined &&
        criteria[maxField] !== null &&
        criteria[minField] > criteria[maxField]
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [minField]
        });
      }
    });
  });

const channelsSchema = z
  .array(z.enum(["in_app", "email"]))
  .min(1, "At least one channel is required")
  .transform((channels) => [...new Set(channels)]);

const createAlertRuleSchema = z
  .object({
    channels: channelsSchema,
    criteria: criteriaSchema.refine(hasCriteria, {
      message: "At least one criterion is required"
    }),
    isEnabled: z.boolean().optional(),
    name: z
      .string({
        required_error: "Alert name is required"
      })
      .trim()
      .min(2, "Alert name must be at least 2 characters")
      .max(100, "Alert name must be at most 100 characters")
  })
  .strict("Unknown fields are not allowed");

const updateAlertRuleSchema = z
  .object({
    channels: channelsSchema.optional(),
    criteria: criteriaSchema
      .refine(hasCriteria, {
        message: "At least one criterion is required"
      })
      .optional(),
    isEnabled: z.boolean().optional(),
    name: z
      .string()
      .trim()
      .min(2, "Alert name must be at least 2 characters")
      .max(100, "Alert name must be at most 100 characters")
      .optional()
  })
  .strict("Unknown fields are not allowed")
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

const alertIdParamsSchema = z
  .object({
    id: objectIdSchema("Alert ID")
  })
  .strict("Unknown fields are not allowed");

const notificationIdParamsSchema = z
  .object({
    id: objectIdSchema("Notification ID")
  })
  .strict("Unknown fields are not allowed");

const notificationListQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit must be at most 100")
      .default(20),
    page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
    unreadOnly: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true")
  })
  .strict("Unknown fields are not allowed");

module.exports = {
  alertIdParamsSchema,
  createAlertRuleSchema,
  notificationIdParamsSchema,
  notificationListQuerySchema,
  updateAlertRuleSchema
};
