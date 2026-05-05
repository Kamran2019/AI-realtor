const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const mockGetText = jest.fn();
const mockDestroy = jest.fn();

jest.mock("pdf-parse", () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    destroy: mockDestroy,
    getText: mockGetText
  }))
}));

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const Property = require("../models/Property");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");
const { MAX_PDF_BYTES } = require("../services/legalPack.service");

const validPassword = "Str0ngPass!";
const pdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF");

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
    tenure: "Leasehold",
    legalPack: {
      status: "missing"
    },
    scoring: {
      riskScore: 100,
      total: 80
    },
    ...overrides
  });

const attachPdf = (requestBuilder, buffer = pdfBuffer) =>
  requestBuilder.attach("file", buffer, {
    contentType: "application/pdf",
    filename: "legal-pack.pdf"
  });

describe("legal pack parsing and risk detection", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Property.syncIndexes(), User.syncIndexes()]);
  }, 60000);

  afterEach(async () => {
    mockGetText.mockReset();
    mockDestroy.mockReset();

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

  it("allows an admin to upload and parse a PDF legal pack", async () => {
    mockGetText.mockResolvedValue({ text: "Lease term 99 years." });
    const admin = await createUser();
    const property = await createProperty(admin._id);
    const accessToken = await login(admin.email);

    const response = await attachPdf(
      request(app)
        .post(`/api/properties/${property._id}/legal-pack`)
        .set("Authorization", `Bearer ${accessToken}`)
    );

    expect(response.status).toBe(200);
    expect(response.body.data.property.legalPack).toEqual(
      expect.objectContaining({
        checksum: expect.any(String),
        key: expect.stringContaining("legal-packs/"),
        parsedAt: expect.any(String),
        sourceType: "upload",
        status: "available"
      })
    );
  });

  it("forbids a regular user from uploading a legal pack", async () => {
    const user = await createUser({ email: "user@example.com", role: "user" });
    const property = await createProperty(user._id);
    const accessToken = await login(user.email);

    const response = await attachPdf(
      request(app)
        .post(`/api/properties/${property._id}/legal-pack`)
        .set("Authorization", `Bearer ${accessToken}`)
    );

    expect(response.status).toBe(403);
  });

  it("rejects invalid file types", async () => {
    const admin = await createUser();
    const property = await createProperty(admin._id);
    const accessToken = await login(admin.email);

    const response = await request(app)
      .post(`/api/properties/${property._id}/legal-pack`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("plain text"), {
        contentType: "text/plain",
        filename: "legal-pack.txt"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/PDF/);
  });

  it("rejects oversized PDFs", async () => {
    const admin = await createUser();
    const property = await createProperty(admin._id);
    const accessToken = await login(admin.email);
    const oversizedPdf = Buffer.concat([
      Buffer.from("%PDF-"),
      Buffer.alloc(MAX_PDF_BYTES + 1, "a")
    ]);

    const response = await attachPdf(
      request(app)
        .post(`/api/properties/${property._id}/legal-pack`)
        .set("Authorization", `Bearer ${accessToken}`),
      oversizedPdf
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/20MB/);
  });

  it("records parsed text metadata", async () => {
    mockGetText.mockResolvedValue({ text: "Legal pack contains damp observations." });
    const admin = await createUser();
    const property = await createProperty(admin._id);
    const accessToken = await login(admin.email);

    const response = await attachPdf(
      request(app)
        .post(`/api/properties/${property._id}/legal-pack`)
        .set("Authorization", `Bearer ${accessToken}`)
    );

    expect(response.status).toBe(200);
    expect(response.body.data.property.legalPack.parsedCharacterCount).toBeGreaterThan(0);
  });

  it("detects deterministic risk phrases", async () => {
    mockGetText.mockResolvedValue({
      text: [
        "Unexpired lease term 72 years.",
        "The report mentions subsidence, structural movement, damp and flood risk.",
        "Planning restriction and non-standard construction are also referenced."
      ].join(" ")
    });
    const admin = await createUser();
    const property = await createProperty(admin._id);
    const accessToken = await login(admin.email);

    const response = await attachPdf(
      request(app)
        .post(`/api/properties/${property._id}/legal-pack`)
        .set("Authorization", `Bearer ${accessToken}`)
    );

    expect(response.status).toBe(200);
    expect(response.body.data.property.risks.map((risk) => risk.key)).toEqual(
      expect.arrayContaining([
        "short_lease",
        "subsidence",
        "structural_movement",
        "damp",
        "flood_risk",
        "planning_restriction",
        "non_standard_construction"
      ])
    );
  });

  it("recalculates the score after risks update", async () => {
    mockGetText.mockResolvedValue({ text: "Unexpired lease term 72 years and subsidence noted." });
    const admin = await createUser();
    const property = await createProperty(admin._id);
    const accessToken = await login(admin.email);

    const response = await attachPdf(
      request(app)
        .post(`/api/properties/${property._id}/legal-pack`)
        .set("Authorization", `Bearer ${accessToken}`)
    );

    expect(response.status).toBe(200);
    expect(response.body.data.property.scoring.riskScore).toBeLessThan(100);
    expect(response.body.data.property.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "legal_pack_parsed"
        })
      ])
    );
  });

  it("shows legal pack risks to authenticated viewers", async () => {
    const owner = await createUser();
    const property = await createProperty(owner._id, {
      risks: [
        {
          key: "damp",
          severity: "medium",
          note: "Matched legal pack wording for damp."
        }
      ],
      legalPack: {
        status: "available",
        parsedAt: new Date("2026-05-01T10:00:00.000Z")
      }
    });
    const accessToken = await login(owner.email);

    const response = await request(app)
      .get(`/api/properties/${property._id}/legal-pack/risks`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.risks).toEqual([
      expect.objectContaining({
        key: "damp",
        severity: "medium"
      })
    ]);
  });
});
