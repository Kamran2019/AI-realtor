const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

jest.mock("../scrapers", () => ({
  getAdapter: jest.fn()
}));

const app = require("../app");
const Property = require("../models/Property");
const ScrapeRun = require("../models/ScrapeRun");
const ScrapeSource = require("../models/ScrapeSource");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");
const { getAdapter } = require("../scrapers");

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
  sourceListingId: "lot-1",
  url: "https://example.com/auctions/lot-1",
  address: {
    line1: "1 Market Street",
    city: "London",
    postcode: "SW1A 1AA",
    country: "UK"
  },
  price: 250000,
  currency: "GBP",
  type: "Flat",
  tenure: "Leasehold",
  description: "A clean listing.",
  ...overrides
});

const mockAdapter = (scrape) => {
  getAdapter.mockReturnValue({ scrape });
};

describe("scraper runner API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([
      Property.syncIndexes(),
      ScrapeRun.syncIndexes(),
      ScrapeSource.syncIndexes(),
      User.syncIndexes()
    ]);
  }, 60000);

  afterEach(async () => {
    getAdapter.mockReset();

    if (mongoose.connection.readyState === 1) {
      await Promise.all([
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

  it("manual run creates a ScrapeRun", async () => {
    const owner = await createUser();
    const source = await createSource(owner._id);
    const accessToken = await login(owner.email);
    mockAdapter(jest.fn().mockResolvedValue([listing()]));

    const response = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.run).toEqual(
      expect.objectContaining({
        sourceKey: source.key,
        status: "completed"
      })
    );
    await expect(ScrapeRun.countDocuments({ sourceId: source._id })).resolves.toBe(1);
  });

  it("creates new properties from listings", async () => {
    const owner = await createUser();
    const source = await createSource(owner._id);
    const accessToken = await login(owner.email);
    mockAdapter(jest.fn().mockResolvedValue([listing()]));

    await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    const property = await Property.findOne({
      ownerUserId: owner._id,
      "source.key": source.key,
      "source.listingId": "lot-1"
    });
    expect(property).toMatchObject({
      address: expect.objectContaining({ city: "London" }),
      prices: expect.objectContaining({
        guide: expect.objectContaining({ amount: 250000 })
      })
    });
  });

  it("re-run dedupes existing properties", async () => {
    const owner = await createUser();
    const source = await createSource(owner._id);
    const accessToken = await login(owner.email);
    mockAdapter(jest.fn().mockResolvedValue([listing()]));

    await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);
    const response = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.body.data.run.stats).toEqual(
      expect.objectContaining({
        created: 0,
        skipped: 1,
        updated: 0
      })
    );
    await expect(Property.countDocuments({ ownerUserId: owner._id })).resolves.toBe(1);
  });

  it("changed fields create history", async () => {
    const owner = await createUser();
    const source = await createSource(owner._id);
    const accessToken = await login(owner.email);
    mockAdapter(
      jest
        .fn()
        .mockResolvedValueOnce([listing()])
        .mockResolvedValueOnce([listing({ price: 275000 })])
    );

    await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);
    const response = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    const property = await Property.findOne({ ownerUserId: owner._id });
    const changedEvent = property.history.find((event) => event.eventType === "scrape_changed");

    expect(response.body.data.run.stats.updated).toBe(1);
    expect(changedEvent.details.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "prices.guide.amount",
          previousValue: 250000,
          newValue: 275000
        })
      ])
    );
  });

  it("adapter failure marks run failed", async () => {
    const owner = await createUser();
    const source = await createSource(owner._id);
    const accessToken = await login(owner.email);
    mockAdapter(jest.fn().mockRejectedValue(new Error("Adapter unavailable")));

    const response = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.run.status).toBe("failed");
    expect(response.body.data.run.error.message).toBe("Adapter unavailable");
    await expect(ScrapeSource.findById(source._id)).resolves.toMatchObject({
      health: expect.objectContaining({
        lastStatus: "failed",
        consecutiveFailures: 1
      })
    });
  });

  it("forbids user role", async () => {
    const user = await createUser({
      email: "user@example.com",
      name: "Regular User",
      role: "user"
    });
    const source = await createSource(user._id);
    const accessToken = await login(user.email);

    const response = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
  });

  it("blocks concurrent runs for the same source", async () => {
    const owner = await createUser();
    const source = await createSource(owner._id);
    const accessToken = await login(owner.email);
    let releaseAdapter;
    const adapterStarted = new Promise((resolve) => {
      mockAdapter(
        jest.fn().mockImplementation(
          () =>
            new Promise((resolveAdapter) => {
              releaseAdapter = () => resolveAdapter([listing()]);
              resolve();
            })
        )
      );
    });

    const firstRequest = request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`)
      .then((response) => response);
    await adapterStarted;

    const secondResponse = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    releaseAdapter();
    const firstResponse = await firstRequest;

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.message).toBe("A scrape run is already running for this source.");
    expect(firstResponse.status).toBe(200);
  });
});
