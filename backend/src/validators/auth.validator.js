const { z } = require("zod");

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

const signupSchema = z
  .object({
    name: z
      .string({
        required_error: "Name is required"
      })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name must be at most 80 characters"),
    email: z
      .string({
        required_error: "Email is required"
      })
      .trim()
      .toLowerCase()
      .email("Email must be valid"),
    password: passwordSchema
  })
  .strict("Unknown fields are not allowed");

const loginSchema = z
  .object({
    email: z
      .string({
        required_error: "Email is required"
      })
      .trim()
      .toLowerCase()
      .email("Email must be valid"),
    password: z
      .string({
        required_error: "Password is required"
      })
      .min(1, "Password is required")
      .max(128, "Password must be at most 128 characters")
  })
  .strict("Unknown fields are not allowed");

const emailSchema = z
  .string({
    required_error: "Email is required"
  })
  .trim()
  .toLowerCase()
  .email("Email must be valid");

const tokenSchema = z
  .string({
    required_error: "Token is required"
  })
  .trim()
  .min(1, "Token is required")
  .max(256, "Token must be at most 256 characters");

const resendVerificationSchema = z
  .object({
    email: emailSchema
  })
  .strict("Unknown fields are not allowed");

const verifyEmailSchema = z
  .object({
    token: tokenSchema
  })
  .strict("Unknown fields are not allowed");

const forgotPasswordSchema = z
  .object({
    email: emailSchema
  })
  .strict("Unknown fields are not allowed");

const resetPasswordSchema = z
  .object({
    token: tokenSchema,
    password: passwordSchema
  })
  .strict("Unknown fields are not allowed");

module.exports = {
  forgotPasswordSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema
};
