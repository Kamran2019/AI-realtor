const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const User = require("../models/User");

const validSignup = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "Str0ngPass!"
};

describe("auth signup API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await User.syncIndexes();
  }, 60000);

  afterEach(async () => {
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

  it("creates a user for a valid signup", async () => {
    const response = await request(app).post("/api/auth/signup").send(validSignup);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: "Account created successfully."
      })
    );
    expect(response.body.data.user.email).toBe(validSignup.email);
    expect(response.body.data.user.name).toBe(validSignup.name);
  });

  it("defaults role to user", async () => {
    const response = await request(app).post("/api/auth/signup").send(validSignup);

    expect(response.body.data.user.role).toBe("user");
  });

  it("stores a hashed password", async () => {
    await request(app).post("/api/auth/signup").send(validSignup);

    const user = await User.findOne({ email: validSignup.email }).select("+passwordHash");

    expect(user.passwordHash).not.toBe(validSignup.password);
    await expect(bcrypt.compare(validSignup.password, user.passwordHash)).resolves.toBe(true);
  });

  it("excludes passwordHash from the response", async () => {
    const response = await request(app).post("/api/auth/signup").send(validSignup);

    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it("returns 409 for duplicate email", async () => {
    await request(app).post("/api/auth/signup").send(validSignup);

    const response = await request(app).post("/api/auth/signup").send(validSignup);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("An account with this email already exists.");
  });

  it("returns 400 for invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ ...validSignup, email: "not-an-email" });

    expect(response.status).toBe(400);
  });

  it("returns 400 for weak password", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ ...validSignup, password: "password" });

    expect(response.status).toBe(400);
  });

  it("returns 400 for missing name", async () => {
    const { name, ...payload } = validSignup;

    const response = await request(app).post("/api/auth/signup").send(payload);

    expect(response.status).toBe(400);
  });

  it("returns 400 for unknown fields", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ ...validSignup, role: "admin" });

    expect(response.status).toBe(400);
  });

  it("rejects case-insensitive duplicate email", async () => {
    await request(app).post("/api/auth/signup").send(validSignup);

    const response = await request(app)
      .post("/api/auth/signup")
      .send({ ...validSignup, email: "ADA@EXAMPLE.COM" });

    expect(response.status).toBe(409);
  });
});
