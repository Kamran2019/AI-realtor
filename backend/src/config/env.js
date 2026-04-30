const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const emptyStringToUndefined = (value) => (value === "" ? undefined : value);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive(),
  MONGO_URI: z.string().trim().min(1),
  MONGO_DNS_SERVERS: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).optional()
  ),
  CLIENT_URL: z.string().url(),
  APP_BASE_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().trim().min(32),
  JWT_REFRESH_SECRET: z.string().trim().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().trim().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().trim().min(1),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
  BREVO_API_KEY: z.preprocess(emptyStringToUndefined, z.string().trim().min(1).optional()),
  BREVO_SENDER_EMAIL: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().email().optional()
  ),
  BREVO_SENDER_NAME: z.preprocess(emptyStringToUndefined, z.string().trim().min(1).optional()),
  STRIPE_SECRET_KEY: z.string().trim().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
  STRIPE_STARTER_MONTHLY_PRICE_ID: z.string().trim().min(1).optional(),
  STRIPE_STARTER_YEARLY_PRICE_ID: z.string().trim().min(1).optional(),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().trim().min(1).optional(),
  STRIPE_PRO_YEARLY_PRICE_ID: z.string().trim().min(1).optional(),
  STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: z.string().trim().min(1).optional(),
  STRIPE_ENTERPRISE_YEARLY_PRICE_ID: z.string().trim().min(1).optional()
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
