const { z } = require("zod");

const objectIdSchema = z
  .string({
    required_error: "Property ID is required"
  })
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid property ID");

const numericQuery = (fieldName) =>
  z.coerce.number().finite(`${fieldName} must be a number`);

const optionalPercent = (fieldName) =>
  numericQuery(fieldName)
    .min(0, `${fieldName} must be at least 0`)
    .max(100, `${fieldName} must be at most 100`)
    .optional();

const optionalMoney = (fieldName) =>
  numericQuery(fieldName).min(0, `${fieldName} must be at least 0`).optional();

const trimmedString = (max, fieldName) =>
  z.string().trim().max(max, `${fieldName} must be at most ${max} characters`);

const propertyIdParamsSchema = z
  .object({
    id: objectIdSchema
  })
  .strict("Unknown fields are not allowed");

const sortFields = [
  "createdAt",
  "updatedAt",
  "auctionDate",
  "guidePrice",
  "price",
  "score",
  "yield",
  "postcode"
];

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit must be at most 100")
      .default(20),
    search: trimmedString(120, "Search").optional(),
    postcode: trimmedString(20, "Postcode").optional(),
    status: trimmedString(40, "Status").optional(),
    type: trimmedString(80, "Type").optional(),
    tenure: trimmedString(80, "Tenure").optional(),
    minPrice: optionalMoney("Minimum price"),
    maxPrice: optionalMoney("Maximum price"),
    minScore: optionalPercent("Minimum score"),
    maxScore: optionalPercent("Maximum score"),
    score: optionalPercent("Score"),
    minYield: optionalPercent("Minimum yield"),
    maxYield: optionalPercent("Maximum yield"),
    yield: optionalPercent("Yield"),
    auctionDate: z.coerce.date().optional(),
    auctionDateFrom: z.coerce.date().optional(),
    auctionDateTo: z.coerce.date().optional(),
    sortBy: z.enum(sortFields).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
  })
  .strict("Unknown fields are not allowed")
  .superRefine((value, context) => {
    const ranges = [
      ["minPrice", "maxPrice", "Minimum price cannot be greater than maximum price"],
      ["minScore", "maxScore", "Minimum score cannot be greater than maximum score"],
      ["minYield", "maxYield", "Minimum yield cannot be greater than maximum yield"],
      ["auctionDateFrom", "auctionDateTo", "Auction date from cannot be after auction date to"]
    ];

    ranges.forEach(([minField, maxField, message]) => {
      if (
        value[minField] !== undefined &&
        value[maxField] !== undefined &&
        value[minField] > value[maxField]
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [minField]
        });
      }
    });
  });

const patchPropertySchema = z
  .object({
    status: trimmedString(40, "Status").toLowerCase().optional(),
    tags: z
      .array(
        z
          .string()
          .trim()
          .toLowerCase()
          .min(1, "Tags cannot be empty")
          .max(50, "Tags must be at most 50 characters")
      )
      .max(20, "At most 20 tags are allowed")
      .optional(),
    description: z
      .string()
      .trim()
      .max(10000, "Description must be at most 10000 characters")
      .nullable()
      .optional()
  })
  .strict("Unknown fields are not allowed")
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

module.exports = {
  listQuerySchema,
  patchPropertySchema,
  propertyIdParamsSchema
};
