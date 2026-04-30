const { z } = require("zod");

const objectIdSchema = z
  .string({
    required_error: "User ID is required"
  })
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid user ID");

const emailSchema = z
  .string({
    required_error: "Email is required"
  })
  .trim()
  .toLowerCase()
  .email("Email must be valid");

const nameSchema = z
  .string({
    required_error: "Name is required"
  })
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be at most 80 characters");

const passwordSchema = z
  .string({
    required_error: "Password is required"
  })
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

const managedRoleSchema = z.enum(["sub_admin", "user"]);
const statusSchema = z.enum(["active", "disabled"]);

const listUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit must be at most 100")
      .default(20),
    search: z.string().trim().max(120, "Search must be at most 120 characters").optional(),
    role: z.enum(["admin", "sub_admin", "user"]).optional(),
    status: z.enum(["active", "disabled", "deleted"]).optional()
  })
  .strict("Unknown fields are not allowed");

const userIdParamsSchema = z
  .object({
    id: objectIdSchema
  })
  .strict("Unknown fields are not allowed");

const createUserSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: managedRoleSchema
  })
  .strict("Unknown fields are not allowed");

const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    role: managedRoleSchema.optional(),
    status: statusSchema.optional()
  })
  .strict("Unknown fields are not allowed")
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

const updateUserStatusSchema = z
  .object({
    status: statusSchema
  })
  .strict("Unknown fields are not allowed");

module.exports = {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamsSchema
};
