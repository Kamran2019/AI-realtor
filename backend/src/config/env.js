const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive(),
  MONGO_URI: z.string().trim().min(1),
  CLIENT_URL: z.string().url(),
  APP_BASE_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().trim().min(32),
  JWT_REFRESH_SECRET: z.string().trim().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().trim().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().trim().min(1),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
  SMTP_HOST: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().trim().min(1).optional()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const missingVariables = parsedEnv.error.issues
    .map((issue) => issue.path.join("."))
    .filter(Boolean);

  throw new Error(
    `Missing or invalid environment variables: ${[...new Set(missingVariables)].join(", ")}`
  );
}

module.exports = {
  ...parsedEnv.data,
  APP_BASE_URL: parsedEnv.data.APP_BASE_URL || parsedEnv.data.CLIENT_URL
};
