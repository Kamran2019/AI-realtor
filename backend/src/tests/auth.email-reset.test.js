const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const User = require("../models/User");
const emailService = require("../services/email.service");
const { hashPassword } = require("../services/password.service");
const { generateRawToken, hashToken } = require("../services/tokenHash.service");

const validPassword = "Str0ngPass!";
const newPassword = "N3wStr0ngPass!";
const validSignup = {
  name: "Katherine Johnson",
  email: "katherine@example.com",
  password: validPassword
};

const createUser = async (overrides = {}) =>
  User.create({
    name: "Katherine Johnson",
    email: validSignup.email,
    passwordHash: await hashPassword(validPassword),
    ...overrides
  });

const extractTokenFromLastEmail = () => {
  const lastEmail = emailService.getTestOutbox().at(-1);
  const match = lastEmail?.text.match(/[?&]token=([a-f0-9]+)/);

  expect(match?.[1]).toEqual(expect.any(String));

  return match[1];
};

const createPasswordResetUser = async (overrides = {}) => {
  const token = generateRawToken();
  const user = await createUser({
    passwordReset: {
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      requestedAt: new Date()
    },
    ...overrides
  });

  return {
    token,
    user
  };
};

describe("auth email verification and password reset API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await User.syncIndexes();
  }, 60000);

  beforeEach(() => {
    emailService.clearTestOutbox();
  });

  afterEach(async () => {
    emailService.clearTestOutbox();

    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("signup creates a hashed verification token", async () => {
    const response = await request(app).post("/api/auth/signup").send(validSignup);
    const user = await User.findOne({ email: validSignup.email }).select(
      "+emailVerification.tokenHash"
    );
    const emailToken = extractTokenFromLastEmail();

    expect(response.status).toBe(201);
    expect(user.emailVerification.tokenHash).toEqual(expect.any(String));
    expect(user.emailVerification.tokenHash).not.toBe(emailToken);
    expect(user.emailVerification.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(emailService.getTestOutbox()).toHaveLength(1);
  });

  it("verify-email accepts a valid token and clears verification fields", async () => {
    await request(app).post("/api/auth/signup").send(validSignup);
    const token = extractTokenFromLastEmail();

    const response = await request(app).post("/api/auth/verify-email").send({ token });
    const user = await User.findOne({ email: validSignup.email }).select(
      "+emailVerification.tokenHash"
    );

    expect(response.status).toBe(200);
    expect(response.body.data.user.emailVerification.isVerified).toBe(true);
    expect(user.emailVerification.isVerified).toBe(true);
    expect(user.emailVerification.verifiedAt).toEqual(expect.any(Date));
    expect(user.emailVerification.tokenHash).toBeNull();
    expect(user.emailVerification.expiresAt).toBeNull();
  });

  it("verify-email rejects an invalid token", async () => {
    const response = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: "not-a-real-token" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid or expired verification token.");
  });

  it("verify-email rejects an expired token", async () => {
    const token = generateRawToken();
    await createUser({
      emailVerification: {
        isVerified: false,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() - 1000),
        verifiedAt: null
      }
    });

    const response = await request(app).post("/api/auth/verify-email").send({ token });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid or expired verification token.");
  });

  it("verify-email succeeds and clears stale tokens for already verified users", async () => {
    const token = generateRawToken();
    await createUser({
      emailVerification: {
        isVerified: true,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verifiedAt: new Date()
      }
    });

    const response = await request(app).post("/api/auth/verify-email").send({ token });
    const user = await User.findOne({ email: validSignup.email }).select(
      "+emailVerification.tokenHash"
    );

    expect(response.status).toBe(200);
    expect(response.body.data.user.emailVerification.isVerified).toBe(true);
    expect(user.emailVerification.tokenHash).toBeNull();
    expect(user.emailVerification.expiresAt).toBeNull();
  });

  it("forgot-password returns generic success for an unknown email", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "missing@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "If an account exists, password reset instructions have been sent."
    );
    expect(emailService.getTestOutbox()).toHaveLength(0);
  });

  it("forgot-password creates and sends a reset token for an active account", async () => {
    await createUser();

    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: validSignup.email });
    const user = await User.findOne({ email: validSignup.email }).select(
      "+passwordReset.tokenHash"
    );
    const emailToken = extractTokenFromLastEmail();

    expect(response.status).toBe(200);
    expect(user.passwordReset.tokenHash).toEqual(expect.any(String));
    expect(user.passwordReset.tokenHash).not.toBe(emailToken);
    expect(user.passwordReset.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("reset-password changes the stored password", async () => {
    const { token } = await createPasswordResetUser();

    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: newPassword });
    const user = await User.findOne({ email: validSignup.email }).select("+passwordHash");

    expect(response.status).toBe(200);
    await expect(bcrypt.compare(newPassword, user.passwordHash)).resolves.toBe(true);
  });

  it("old password fails after reset", async () => {
    const { token } = await createPasswordResetUser();

    await request(app).post("/api/auth/reset-password").send({ token, password: newPassword });
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: validSignup.email, password: validPassword });

    expect(response.status).toBe(401);
  });

  it("new password logs in after reset", async () => {
    const { token } = await createPasswordResetUser();

    await request(app).post("/api/auth/reset-password").send({ token, password: newPassword });
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: validSignup.email, password: newPassword });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
  });

  it("reset-password clears refresh and reset hashes", async () => {
    const { token } = await createPasswordResetUser({
      auth: {
        refreshTokenHash: hashToken("stored-refresh-token")
      }
    });

    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: newPassword });
    const user = await User.findOne({ email: validSignup.email }).select(
      "+passwordReset.tokenHash +auth.refreshTokenHash"
    );

    expect(response.status).toBe(200);
    expect(user.passwordReset.tokenHash).toBeNull();
    expect(user.passwordReset.expiresAt).toBeNull();
    expect(user.passwordReset.requestedAt).toBeNull();
    expect(user.auth.refreshTokenHash).toBeNull();
  });
});
