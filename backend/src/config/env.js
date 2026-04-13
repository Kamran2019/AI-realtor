const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri:
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-auction-analyzer",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "access-secret-change-me",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "refresh-secret-change-me",
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  jwtRefreshExpiryDays: Number(process.env.JWT_REFRESH_EXPIRY_DAYS || 30),
  cookieSecure: process.env.COOKIE_SECURE === "true",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "noreply@example.com",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripeStarterMonthlyPriceId:
    process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "",
  stripeStarterYearlyPriceId:
    process.env.STRIPE_STARTER_YEARLY_PRICE_ID || "",
  stripeProMonthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
  stripeProYearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
  stripeEnterpriseMonthlyPriceId:
    process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "",
  stripeEnterpriseYearlyPriceId:
    process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || "",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5000",
  uploadsDir: process.env.UPLOADS_DIR || "uploads",
  usePuppeteerFallback: process.env.USE_PUPPETEER_FALLBACK === "true",
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || "admin@example.com",
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!",
  adminSeedName: process.env.ADMIN_SEED_NAME || "Platform Admin",
};

module.exports = env;

