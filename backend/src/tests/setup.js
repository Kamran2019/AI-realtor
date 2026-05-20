process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.PORT = process.env.PORT || "5001";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-realtor-test";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "test-access-secret-that-is-long-enough";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret-that-is-long-enough";
process.env.ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
process.env.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE || "false";
process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || "test-brevo-api-key";
process.env.BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "no-reply@example.com";
process.env.BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "AI Realtor";
