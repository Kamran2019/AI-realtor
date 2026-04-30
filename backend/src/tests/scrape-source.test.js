const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const ScrapeRun = require("../models/ScrapeRun");
const ScrapeSource = require("../models/ScrapeSource");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");

const validPassword = "Str0ngPass!";

const createUser = async (overrides = {}) =>
  User.create({
    email: overrides.email || "admin@example.com",
    name: overrides.name || "Admin User",
    passwordHash: await hashPassword(validPassword),
    role: overrides.role || "admin",
    ...overrides
  });

const login = async (email) => {
  const response = await request(app).post("/api/auth/login").send({
    email,
    password: validPassword
  });

  return response.body.data.accessToken;
};

const validSourcePayload = {
  baseUrl: "https://example.com/auctions",
  cron: "0 9 * * *",
  key: "auction-house",
  name: "Auction House",
  timezone: "Europe/London"
};

describe("scrape source API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([User.syncIndexes(), ScrapeSource.syncIndexes()]);
  }, 60000);

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await Promise.all([ScrapeRun.deleteMany({}), ScrapeSource.deleteMany({}), User.deleteMany({})]);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("creates a source", async () => {
    await createUser();
    const accessToken = await login("admin@example.com");

    const response = await request(app)
      .post("/api/scrape/sources")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validSourcePayload);

    expect(response.status).toBe(201);
    expect(response.body.data.source).toEqual(
      expect.objectContaining({
        baseUrl: validSourcePayload.baseUrl,
        isEnabled: true,
        key: validSourcePayload.key,
        name: validSourcePayload.name,
        timezone: validSourcePayload.timezone
      })
    );
  });

  it("blocks duplicate keys for the same owner", async () => {
    await createUser();
    const accessToken = await login("admin@example.com");

    await request(app)
      .post("/api/scrape/sources")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(validSourcePayload);
    const response = await request(app)
      .post("/api/scrape/sources")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validSourcePayload, name: "Other Auction House" });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("A scrape source with this key already exists.");
  });

  it("blocks invalid URLs", async () => {
    await createUser();
    const accessToken = await login("admin@example.com");

    const response = await request(app)
      .post("/api/scrape/sources")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validSourcePayload, baseUrl: "not-a-url" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("forbids user role", async () => {
    await createUser({
      email: "user@example.com",
      name: "Regular User",
      role: "user"
    });
    const accessToken = await login("user@example.com");

    const response = await request(app)
      .get("/api/scrape/sources")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
  });

  it("lists sources scoped by owner", async () => {
    const firstOwner = await createUser({
      email: "first@example.com",
      name: "First Admin"
    });
    const secondOwner = await createUser({
      email: "second@example.com",
      name: "Second Admin"
    });
    await ScrapeSource.create([
      {
        ...validSourcePayload,
        ownerUserId: firstOwner._id
      },
      {
        ...validSourcePayload,
        key: "second-source",
        name: "Second Source",
        ownerUserId: secondOwner._id
      }
    ]);
    const accessToken = await login("first@example.com");

    const response = await request(app)
      .get("/api/scrape/sources")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.sources).toHaveLength(1);
    expect(response.body.data.sources[0].key).toBe(validSourcePayload.key);
  });

  it("toggles source status", async () => {
    const owner = await createUser();
    const source = await ScrapeSource.create({
      ...validSourcePayload,
      ownerUserId: owner._id
    });
    const accessToken = await login("admin@example.com");

    const response = await request(app)
      .patch(`/api/scrape/sources/${source._id}/status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ isEnabled: false });

    expect(response.status).toBe(200);
    expect(response.body.data.source.isEnabled).toBe(false);
    await expect(ScrapeSource.findById(source._id)).resolves.toMatchObject({
      isEnabled: false
    });
  });
});
