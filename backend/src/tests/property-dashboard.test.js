const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const Property = require("../models/Property");
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

const createProperty = async (ownerUserId, overrides = {}) =>
  Property.create({
    ownerUserId,
    source: {
      key: "source-one",
      listingId: overrides.listingId || "lot-1",
      url: "https://example.com/lot-1",
      scrapedAt: new Date("2026-01-01T09:00:00.000Z")
    },
    address: {
      line1: "1 Market Street",
      city: "London",
      postcode: "SW1A 1AA",
      country: "UK",
      ...(overrides.address || {})
    },
    prices: {
      guide: {
        amount: 250000,
        currency: "GBP",
        ...(overrides.guide || {})
      }
    },
    auctionDate: new Date("2026-06-15T10:00:00.000Z"),
    type: "Flat",
    tenure: "Leasehold",
    description: "A bright London auction listing.",
    scoring: {
      total: 78,
      yieldScore: 62
    },
    status: "new",
    tags: ["central"],
    ...overrides
  });

describe("property dashboard API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Property.syncIndexes(), User.syncIndexes()]);
  }, 60000);

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await Promise.all([Property.deleteMany({}), User.deleteMany({})]);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("lists own properties", async () => {
    const owner = await createUser();
    await createProperty(owner._id);
    const accessToken = await login(owner.email);

    const response = await request(app)
      .get("/api/properties")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.properties).toHaveLength(1);
    expect(response.body.data.properties[0]).toEqual(
      expect.objectContaining({
        status: "new",
        type: "Flat"
      })
    );
  });

  it("searches, filters, and sorts properties", async () => {
    const owner = await createUser();
    await createProperty(owner._id, {
      listingId: "alpha",
      address: {
        line1: "10 River View",
        city: "Bristol",
        postcode: "BS1 4ST"
      },
      guide: {
        amount: 180000
      },
      scoring: {
        total: 70,
        yieldScore: 55
      },
      status: "watching",
      tenure: "Freehold",
      type: "House"
    });
    await createProperty(owner._id, {
      listingId: "beta",
      address: {
        line1: "20 River View",
        city: "Bristol",
        postcode: "BS2 8AA"
      },
      guide: {
        amount: 320000
      },
      scoring: {
        total: 92,
        yieldScore: 80
      },
      status: "watching",
      tenure: "Freehold",
      type: "House"
    });
    await createProperty(owner._id, {
      listingId: "gamma",
      address: {
        line1: "5 Station Road",
        city: "York",
        postcode: "YO1 7AA"
      },
      guide: {
        amount: 125000
      },
      scoring: {
        total: 50,
        yieldScore: 40
      },
      status: "archived",
      type: "Flat"
    });
    const accessToken = await login(owner.email);

    const response = await request(app)
      .get("/api/properties")
      .query({
        search: "River",
        postcode: "BS",
        status: "watching",
        minPrice: 150000,
        maxPrice: 350000,
        minScore: 60,
        minYield: 50,
        type: "House",
        tenure: "Freehold",
        sortBy: "price",
        sortOrder: "desc"
      })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.properties.map((property) => property.source.listingId)).toEqual([
      "beta",
      "alpha"
    ]);
  });

  it("returns pagination metadata", async () => {
    const owner = await createUser();
    await Promise.all([
      createProperty(owner._id, { listingId: "lot-1" }),
      createProperty(owner._id, { listingId: "lot-2" }),
      createProperty(owner._id, { listingId: "lot-3" })
    ]);
    const accessToken = await login(owner.email);

    const response = await request(app)
      .get("/api/properties")
      .query({ limit: 2, page: 2 })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.properties).toHaveLength(1);
    expect(response.body.data.pagination).toEqual({
      limit: 2,
      page: 2,
      total: 3,
      totalPages: 2
    });
  });

  it("loads property detail", async () => {
    const owner = await createUser();
    const property = await createProperty(owner._id);
    const accessToken = await login(owner.email);

    const response = await request(app)
      .get(`/api/properties/${property._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.property.id).toBe(property._id.toString());
    expect(response.body.data.property.address.city).toBe("London");
  });

  it("hides cross-owner properties", async () => {
    const owner = await createUser({ email: "owner@example.com", name: "Owner User" });
    const otherOwner = await createUser({ email: "other@example.com", name: "Other User" });
    const otherProperty = await createProperty(otherOwner._id);
    const accessToken = await login(owner.email);

    const listResponse = await request(app)
      .get("/api/properties")
      .set("Authorization", `Bearer ${accessToken}`);
    const detailResponse = await request(app)
      .get(`/api/properties/${otherProperty._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.properties).toHaveLength(0);
    expect(detailResponse.status).toBe(404);
  });

  it("forbids user patch requests", async () => {
    const user = await createUser({
      email: "user@example.com",
      name: "Regular User",
      role: "user"
    });
    const property = await createProperty(user._id);
    const accessToken = await login(user.email);

    const response = await request(app)
      .patch(`/api/properties/${property._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "watching" });

    expect(response.status).toBe(403);
  });

  it("allows admin patch for limited fields", async () => {
    const owner = await createUser();
    const property = await createProperty(owner._id);
    const accessToken = await login(owner.email);

    const response = await request(app)
      .patch(`/api/properties/${property._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        description: "Updated dashboard note.",
        status: "watching",
        tags: ["High Yield", "North"]
      });

    expect(response.status).toBe(200);
    expect(response.body.data.property).toEqual(
      expect.objectContaining({
        description: "Updated dashboard note.",
        status: "watching",
        tags: ["high yield", "north"]
      })
    );
  });

  it("rejects disallowed patch fields", async () => {
    const owner = await createUser();
    const property = await createProperty(owner._id);
    const accessToken = await login(owner.email);

    const response = await request(app)
      .patch(`/api/properties/${property._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        prices: {
          guide: {
            amount: 1
          }
        }
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});
