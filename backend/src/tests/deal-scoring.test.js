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
const { getAdapter } = require("../scrapers");
const { calculatePropertyScore } = require("../services/dealScoring.service");
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
      country: "UK"
    },
    prices: {
      guide: {
        amount: 200000,
        currency: "GBP"
      }
    },
    auctionDate: new Date("2026-06-15T10:00:00.000Z"),
    bedrooms: 2,
    floorAreaSqFt: 740,
    tenure: "Freehold",
    legalPack: {
      status: "reviewed"
    },
    ...overrides
  });

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
  price: 200000,
  currency: "GBP",
  bedrooms: 2,
  floorAreaSqFt: 740,
  tenure: "Freehold",
  legalPack: {
    status: "reviewed"
  },
  ...overrides
});

describe("deal scoring", () => {
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

  it("returns unknown when guide price is missing", () => {
    const scoring = calculatePropertyScore({
      prices: {
        guide: {
          amount: null,
          currency: "GBP"
        }
      },
      legalPack: {
        status: "missing"
      }
    });

    expect(scoring).toEqual(
      expect.objectContaining({
        total: null,
        category: "unknown",
        grossYield: null,
        roi: null
      })
    );
  });

  it("computes ARV, rent, yield, and ROI", () => {
    const scoring = calculatePropertyScore({
      prices: {
        guide: {
          amount: 200000,
          currency: "GBP"
        }
      },
      bedrooms: 2,
      floorAreaSqFt: 740,
      tenure: "Freehold",
      auctionDate: new Date("2026-06-15T10:00:00.000Z"),
      legalPack: {
        status: "reviewed"
      },
      risks: []
    });

    expect(scoring).toEqual(
      expect.objectContaining({
        arv: {
          amount: 230000,
          currency: "GBP"
        },
        rent: {
          monthly: 1200,
          annual: 14400,
          currency: "GBP"
        },
        grossYield: 7.2,
        roi: 22.2
      })
    );
  });

  it("clamps score outputs to 0-100", () => {
    const scoring = calculatePropertyScore({
      prices: {
        guide: {
          amount: 1000,
          currency: "GBP"
        }
      },
      bedrooms: 5,
      floorAreaSqFt: 1600,
      tenure: "Freehold",
      auctionDate: new Date("2026-06-15T10:00:00.000Z"),
      legalPack: {
        status: "reviewed"
      },
      risks: []
    });

    expect(scoring.total).toBeLessThanOrEqual(100);
    expect(scoring.yieldScore).toBe(100);
  });

  it("changes confidence with data completeness", () => {
    const minimal = calculatePropertyScore({
      prices: {
        guide: {
          amount: 200000,
          currency: "GBP"
        }
      },
      risks: []
    });
    const complete = calculatePropertyScore({
      prices: {
        guide: {
          amount: 200000,
          currency: "GBP"
        }
      },
      bedrooms: 3,
      floorAreaSqFt: 950,
      tenure: "Freehold",
      auctionDate: new Date("2026-06-15T10:00:00.000Z"),
      legalPack: {
        status: "reviewed"
      },
      risks: []
    });

    expect(complete.confidence).toBeGreaterThan(minimal.confidence);
  });

  it("reduces score for red flags", () => {
    const baseline = calculatePropertyScore({
      prices: {
        guide: {
          amount: 200000,
          currency: "GBP"
        }
      },
      bedrooms: 2,
      tenure: "Freehold",
      legalPack: {
        status: "reviewed"
      },
      risks: []
    });
    const flagged = calculatePropertyScore({
      prices: {
        guide: {
          amount: 200000,
          currency: "GBP"
        }
      },
      bedrooms: 2,
      tenure: "Freehold",
      legalPack: {
        status: "reviewed"
      },
      risks: [{ key: "subsidence", severity: "high" }]
    });

    expect(flagged.total).toBeLessThan(baseline.total);
    expect(flagged.riskScore).toBeLessThan(baseline.riskScore);
  });

  it("allows admin to recalculate a property score", async () => {
    const owner = await createUser();
    const property = await createProperty(owner._id, {
      scoring: {
        total: 5,
        category: "risky"
      }
    });
    const accessToken = await login(owner.email);

    const response = await request(app)
      .post(`/api/scoring/properties/${property._id}/recalculate`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.scoring).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        arv: expect.objectContaining({ amount: 230000 }),
        category: expect.not.stringMatching(/^unknown$/)
      })
    );
  });

  it("forbids user role from recalculating scores", async () => {
    const user = await createUser({
      email: "user@example.com",
      name: "Regular User",
      role: "user"
    });
    const property = await createProperty(user._id);
    const accessToken = await login(user.email);

    const response = await request(app)
      .post(`/api/scoring/properties/${property._id}/recalculate`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
  });

  it("auto-scores properties created by scraper runs", async () => {
    const owner = await createUser();
    const source = await createSource(owner._id);
    const accessToken = await login(owner.email);
    getAdapter.mockReturnValue({ scrape: jest.fn().mockResolvedValue([listing()]) });

    const response = await request(app)
      .post(`/api/scrape/sources/${source._id}/run`)
      .set("Authorization", `Bearer ${accessToken}`);

    const property = await Property.findOne({ ownerUserId: owner._id, "source.listingId": "lot-1" });

    expect(response.status).toBe(200);
    expect(property.scoring).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        arv: expect.objectContaining({ amount: 230000 }),
        grossYield: 7.2
      })
    );
  });
});
