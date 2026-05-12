const { z } = require("zod");

const defectTypes = [
  "crack",
  "damp",
  "mould",
  "poor_finish",
  "structural_issue",
  "peeling_paint",
  "water_seepage",
  "stain",
  "wall_hole",
  "tile_damage",
  "manual_other"
];

const statusValues = ["draft", "in_progress", "completed", "archived"];
const severityValues = ["low", "medium", "high"];

const objectIdSchema = (fieldName) =>
  z
    .string({
      required_error: `${fieldName} is required`
    })
    .trim()
    .regex(/^[a-f\d]{24}$/i, `Invalid ${fieldName}`);

const optionalObjectIdSchema = (fieldName) => objectIdSchema(fieldName).optional();
const nullableObjectIdSchema = (fieldName) => objectIdSchema(fieldName).nullable().optional();

const emptyToUndefined = (value) => (value === "" ? undefined : value);

const optionalTrimmedString = (fieldName, max) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, `${fieldName} must be at most ${max} characters`).optional()
  );

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().toLowerCase().email("Client email must be valid").optional()
);

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const optionalNumber = (fieldName) =>
  z.preprocess(emptyToUndefined, z.coerce.number().finite(`${fieldName} must be a number`).optional());

const inspectionIdParamsSchema = z
  .object({
    id: objectIdSchema("inspection ID")
  })
  .strict("Unknown fields are not allowed");

const inspectionRoomParamsSchema = z
  .object({
    id: objectIdSchema("inspection ID"),
    roomId: objectIdSchema("room ID")
  })
  .strict("Unknown fields are not allowed");

const inspectionDefectParamsSchema = z
  .object({
    id: objectIdSchema("inspection ID"),
    roomId: objectIdSchema("room ID"),
    defectId: objectIdSchema("defect ID")
  })
  .strict("Unknown fields are not allowed");

const propertyRefCreateSchema = z
  .object({
    propertyId: optionalObjectIdSchema("property ID"),
    address: optionalTrimmedString("Property address", 300),
    postcode: optionalTrimmedString("Postcode", 12)
  })
  .strict("Unknown fields are not allowed")
  .refine((value) => value.propertyId || value.address, {
    message: "Property address is required when property ID is not supplied",
    path: ["address"]
  });

const propertyRefUpdateSchema = z
  .object({
    propertyId: nullableObjectIdSchema("property ID"),
    address: optionalTrimmedString("Property address", 300).nullable().optional(),
    postcode: optionalTrimmedString("Postcode", 12).nullable().optional()
  })
  .strict("Unknown fields are not allowed")
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one property field is required"
  });

const clientSchema = z
  .object({
    name: optionalTrimmedString("Client name", 120),
    email: optionalEmail,
    phone: optionalTrimmedString("Client phone", 30)
  })
  .strict("Unknown fields are not allowed");

const clientUpdateSchema = z
  .object({
    name: optionalTrimmedString("Client name", 120).nullable().optional(),
    email: optionalEmail.nullable().optional(),
    phone: optionalTrimmedString("Client phone", 30).nullable().optional()
  })
  .strict("Unknown fields are not allowed")
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one client field is required"
  });

const geoSchema = z
  .object({
    lat: optionalNumber("Latitude").refine((value) => value === undefined || (value >= -90 && value <= 90), {
      message: "Latitude must be between -90 and 90"
    }),
    lng: optionalNumber("Longitude").refine(
      (value) => value === undefined || (value >= -180 && value <= 180),
      {
        message: "Longitude must be between -180 and 180"
      }
    )
  })
  .strict("Unknown fields are not allowed");

const summaryUpdateSchema = z
  .object({
    notes: optionalTrimmedString("Summary notes", 3000)
  })
  .strict("Unknown fields are not allowed");

const createInspectionSchema = z
  .object({
    propertyRef: propertyRefCreateSchema,
    client: clientSchema.optional(),
    assignedToUserId: optionalObjectIdSchema("assigned user ID"),
    capturedAt: optionalDate,
    geo: geoSchema.optional(),
    summary: summaryUpdateSchema.optional(),
    recommendations: z.array(z.string().trim().min(1).max(1000)).max(30).optional()
  })
  .strict("Unknown fields are not allowed");

const updateInspectionSchema = z
  .object({
    propertyRef: propertyRefUpdateSchema.optional(),
    client: clientUpdateSchema.optional(),
    assignedToUserId: nullableObjectIdSchema("assigned user ID"),
    capturedAt: optionalDate.nullable().optional(),
    geo: geoSchema.optional(),
    summary: summaryUpdateSchema.optional(),
    recommendations: z.array(z.string().trim().min(1).max(1000)).max(30).optional()
  })
  .strict("Unknown fields are not allowed")
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

const roomSchema = z
  .object({
    name: z
      .string({
        required_error: "Room name is required"
      })
      .trim()
      .min(1, "Room name is required")
      .max(80, "Room name must be at most 80 characters"),
    notes: optionalTrimmedString("Room notes", 3000)
  })
  .strict("Unknown fields are not allowed");

const updateRoomSchema = roomSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

const defectBoxSchema = z
  .object({
    x: optionalNumber("Box x"),
    y: optionalNumber("Box y"),
    w: optionalNumber("Box width"),
    h: optionalNumber("Box height")
  })
  .strict("Unknown fields are not allowed");

const manualDefectSchema = z
  .object({
    type: z.enum(defectTypes, {
      required_error: "Defect type is required"
    }),
    severity: z.enum(severityValues, {
      required_error: "Defect severity is required"
    }),
    notes: optionalTrimmedString("Defect notes", 3000),
    imageUrl: optionalTrimmedString("Image URL", 1000),
    box: defectBoxSchema.optional()
  })
  .strict("Unknown fields are not allowed");

const updateDefectSchema = manualDefectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

const changeStatusSchema = z
  .object({
    status: z.enum(statusValues, {
      required_error: "Status is required"
    })
  })
  .strict("Unknown fields are not allowed");

const listInspectionsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit must be at most 100")
      .default(20),
    status: z.enum(statusValues).optional(),
    search: optionalTrimmedString("Search", 120),
    createdFrom: optionalDate,
    createdTo: optionalDate
  })
  .strict("Unknown fields are not allowed")
  .superRefine((value, context) => {
    if (value.createdFrom && value.createdTo && value.createdFrom > value.createdTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Created from cannot be after created to",
        path: ["createdFrom"]
      });
    }
  });

module.exports = {
  changeStatusSchema,
  createInspectionSchema,
  inspectionDefectParamsSchema,
  inspectionIdParamsSchema,
  inspectionRoomParamsSchema,
  listInspectionsQuerySchema,
  manualDefectSchema,
  updateDefectSchema,
  updateInspectionSchema,
  updateRoomSchema,
  roomSchema
};
