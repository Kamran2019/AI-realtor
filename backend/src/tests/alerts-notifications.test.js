const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

jest.mock("../scrapers", () => ({
  getAdapter: jest.fn()
}));

const app = require("../app");
const AlertRule = require("../models/AlertRule");
const Notification = require("../models/Notification");
const Property = require("../models/Property");
const ScrapeRun = require("../models/ScrapeRun");
const ScrapeSource = require("../models/ScrapeSource");
const User = require("../models/User");
const { clearTestOutbox, getTestOutbox } = require("../services/email.service");
const { hashPassword } = require("../services/password.service");
const { getAdapter } = require("../scrapers");

const validPassword = "Str0ngPass!";

const createUser = async (overrides = {}) =>
  User.create({
    email: overrides.email || "user@example.com",
    name: overrides.name || "Test User",
    passwordHash: await hashPassword(validPassword),
    role: overrides.role || "user",
    ...overrides
  });

const login = async (email) => {
  const response = await request(app).post("/api/auth/login").send({
    email,
    password: validPassword
  });

  return response.body.data.accessToken;
};

const createSource = async (ownerUserId, overrides = {}) =>
  ScrapeSource.create({
    baseUrl: "https://example.com/auctions",
    cron: "0 9 * * *",
    key: "source-one",
    name: "Source One",
    timezone: "Europe/London",
    ownerUserId,
    ...overrides
  });

const listing = (overrides = {}) => ({
  sourceListingId: "alert-lot-1",
  url: "https://example.com/auctions/alert-lot-1",
  address: {
    line1: "8 Alert Street",
    city: "London",
    postcode: "SW1A 1AA",
    country: "UK"
  },
  price: 200000,
  currency: "GBP",
  bedrooms: 2,
  floorAreaSqFt: 740,
  type: "House",
  tenure: "Freehold",
  legalPack: {
    status: "reviewed"
  },
  ...overrides
});

const matchingCriteria = {
  maxPrice: 250000,
  minScore: 60,
  minYield: 7,
  postcodes: ["SW1A"],
  tenure: "Freehold",
  type: "House"
};

const alertPayload = (overrides = {}) => ({
  channels: ["in_app"],
  criteria: matchingCriteria,
  name: "Prime London deals",
  ...overrides
});

const createAlertRule = (userId, overrides = {}) =>
  AlertRule.create({
    channels: ["in_app"],
    criteria: matchingCriteria,
    name: overrides.name || "Existing alert",
    userId,
    ...overrides
  });

describe("alerts and notifications API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([
      AlertRule.syncIndexes(),
      Notification.syncIndexes(),
      Property.syncIndexes(),
      ScrapeRun.syncIndexes(),
      ScrapeSource.syncIndexes(),
      User.syncIndexes()
    ]);
  }, 60000);

  afterEach(async () => {
    getAdapter.mockReset();
    clearTestOutbox();

    if (mongoose.connection.readyState === 1) {
      await Promise.all([
        AlertRule.deleteMany({}),
        Notification.deleteMany({}),
        Property.deleteMany({}),
        ScrapeRun.deleteMany({}),
        ScrapeSource.deleteMany({}),
        User.deleteMany({})
      ]);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("creates an alert within the plan limit", async () => {
    const user = await createUser();
    const accessToken = await login(user.email);

    const response = await request(app)
      .post("/api/alerts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(alertPayload());

    expect(response.status).toBe(201);
    expect(response.body.data.alertRule).toEqual(
      expect.objectContaining({
        channels: ["in_app"],
        name: "Prime London deals",
        userId: user._id.toString()
      })
    );
    await expect(AlertRule.countDocuments({ userId: user._id })).resolves.toBe(1);
  });

  it("enforces the plan alert limit", async () => {
    const user = await createUser();
    await Promise.all([
      createAlertRule(user._id, { name: "Alert 1" }),
      createAlertRule(user._id, { name: "Alert 2" }),
      createAlertRule(user._id, { name: "Alert 3" })
    ]);
    const accessToken = await login(user.email);

    const response = await request(app)
      .post("/api/alerts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(alertPayload({ name: "Alert 4" }));

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Alert limit reached for your plan (3).");
  });

  it("requires at least one criterion", async () => {
    const user = await createUser();
    const accessToken = await login(user.email);

    const response = await request(app)
      .post("/api/alerts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(
        alertPayload({
          criteria: {}
        })
      );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("creates a notification when a scraper property matches an alert", async () => {
    const owner = await createUser({
      email: "admin@example.com",
      name: "Admin User",
      role: "admin"
    });
    const source = await createSource(owner._id);
    await createAlertRule(owner._id);
    const accessToken = await login(owner.email);
    getAdapter.mockReturnValue({ scrape: jest.fn().mockResolvedValue([listing()]) });

    const response = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);
    const notification = await Notification.findOne({ userId: owner._id });

    expect(response.status).toBe(200);
    expect(notification).toEqual(
      expect.objectContaining({
        propertyId: expect.any(mongoose.Types.ObjectId),
        readAt: null,
        title: "Alert matched: Existing alert"
      })
    );
  });

  it("does not create a notification when the property does not match", async () => {
    const owner = await createUser({
      email: "admin@example.com",
      name: "Admin User",
      role: "admin"
    });
    const source = await createSource(owner._id);
    await createAlertRule(owner._id, {
      criteria: {
        maxPrice: 100000
      }
    });
    const accessToken = await login(owner.email);
    getAdapter.mockReturnValue({ scrape: jest.fn().mockResolvedValue([listing()]) });

    const response = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    await expect(Notification.countDocuments({ userId: owner._id })).resolves.toBe(0);
  });

  it("sends email when the alert email channel is enabled", async () => {
    const owner = await createUser({
      email: "admin@example.com",
      name: "Admin User",
      role: "admin"
    });
    const source = await createSource(owner._id);
    await createAlertRule(owner._id, {
      channels: ["in_app", "email"],
      name: "Email alert"
    });
    const accessToken = await login(owner.email);
    getAdapter.mockReturnValue({ scrape: jest.fn().mockResolvedValue([listing()]) });

    const response = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(getTestOutbox()).toHaveLength(1);
    expect(getTestOutbox()[0]).toEqual(
      expect.objectContaining({
        subject: "AI Realtor alert: Email alert",
        to: "admin@example.com"
      })
    );
  });

  it("marks notifications read", async () => {
    const user = await createUser();
    const notification = await Notification.create({
      channels: ["in_app"],
      message: "A match is ready.",
      title: "Alert matched",
      userId: user._id
    });
    const accessToken = await login(user.email);

    const response = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set("Authorization", `Bearer ${accessToken}`);
    const countResponse = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.notification.readAt).toBeTruthy();
    expect(countResponse.body.data.unreadCount).toBe(0);
  });

  it("only lists the authenticated user's notifications", async () => {
    const user = await createUser({
      email: "owner@example.com",
      name: "Owner User"
    });
    const otherUser = await createUser({
      email: "other@example.com",
      name: "Other User"
    });
    await Notification.create({
      channels: ["in_app"],
      message: "Owner notification.",
      title: "Owner alert",
      userId: user._id
    });
    await Notification.create({
      channels: ["in_app"],
      message: "Other notification.",
      title: "Other alert",
      userId: otherUser._id
    });
    const accessToken = await login(user.email);

    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.notifications).toHaveLength(1);
    expect(response.body.data.notifications[0]).toEqual(
      expect.objectContaining({
        title: "Owner alert",
        userId: user._id.toString()
      })
    );
  });
});
