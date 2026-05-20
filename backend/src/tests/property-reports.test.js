const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const Property = require("../models/Property");
const Report = require("../models/Report");
const User = require("../models/User");
const pdfService = require("../services/pdf/propertyReportPdf.service");
const { hashPassword } = require("../services/password.service");

const validPassword = "Str0ngPass!";

const createUser = async (overrides = {}) =>
  User.create({
    email: overrides.email || "reports-admin@example.com",
    name: overrides.name || "Reports Admin",
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
      listingId: overrides.listingId || "report-lot-1",
      url: overrides.sourceUrl || "https://example.com/report-lot-1",
      scrapedAt: new Date("2026-01-01T09:00:00.000Z")
    },
    address: {
      line1: "12 Report Street",
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
    bedrooms: 2,
    floorAreaSqFt: 720,
    description: "A bright London auction listing.",
    risks: overrides.risks || [
      {
        key: "short_lease",
        severity: "high",
        note: "Lease term needs review"
      }
    ],
    scoring: {
      total: 78,
      yieldScore: 62,
      grossYield: 6.4,
      riskScore: 76,
      category: "solid",
      confidence: 82,
      roi: 18.5,
      arv: {
        amount: 287500,
        currency: "GBP"
      },
      rent: {
        annual: 14400,
        monthly: 1200,
        currency: "GBP"
      },
      notes: "Estimated using 2 bedroom rent assumptions."
    },
    status: overrides.status || "new",
    tags: ["central"],
    ...overrides
  });

describe("property exports and reports API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Property.syncIndexes(), Report.syncIndexes(), User.syncIndexes()]);
  }, 60000);

  afterEach(async () => {
    jest.restoreAllMocks();

    if (mongoose.connection.readyState === 1) {
      await Promise.all([Property.deleteMany({}), Report.deleteMany({}), User.deleteMany({})]);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("returns CSV content-type", async () => {
    const owner = await createUser();
    await createProperty(owner._id);
    const accessToken = await login(owner.email);

    const response = await request(app)
      .get("/api/properties/export.csv")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/csv/);
    expect(response.text).toContain("Listing ID,Address,City,Postcode");
  });

  it("exports CSV using property filters", async () => {
    const owner = await createUser();
    await createProperty(owner._id, { listingId: "watch-lot", status: "watching" });
    await createProperty(owner._id, { listingId: "archive-lot", status: "archived" });
    const accessToken = await login(owner.email);

    const response = await request(app)
      .get("/api/properties/export.csv")
      .query({ status: "watching" })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain("watch-lot");
    expect(response.text).not.toContain("archive-lot");
  });

  it("creates a PDF report for a property", async () => {
    const owner = await createUser();
    const property = await createProperty(owner._id);
    const accessToken = await login(owner.email);

    const response = await request(app)
      .post(`/api/reports/property/${property._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    const report = await Report.findOne({ ownerUserId: owner._id, propertyId: property._id });

    expect(response.status).toBe(201);
    expect(report).toBeTruthy();
    expect(response.body.data.report).toEqual(
      expect.objectContaining({
        status: "ready",
        type: "property_investor_pdf"
      })
    );
  });

  it("marks generated reports ready with a URL and storage key", async () => {
    const owner = await createUser();
    const property = await createProperty(owner._id);
    const accessToken = await login(owner.email);

    const createResponse = await request(app)
      .post(`/api/reports/property/${property._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    const report = createResponse.body.data.report;

    const detailResponse = await request(app)
      .get(`/api/reports/${report.id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    const downloadResponse = await request(app)
      .get(`/api/reports/${report.id}/download`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.report).toEqual(
      expect.objectContaining({
        downloadUrl: `/api/reports/${report.id}/download`,
        fileKey: expect.stringMatching(/^reports\//),
        status: "ready"
      })
    );
    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.headers["content-type"]).toMatch(/application\/pdf/);
    expect(downloadResponse.body.subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });

  it("blocks cross-owner report access", async () => {
    const owner = await createUser({ email: "owner@example.com", name: "Owner User" });
    const otherOwner = await createUser({ email: "other@example.com", name: "Other User" });
    const otherProperty = await createProperty(otherOwner._id);
    const otherReport = await Report.create({
      ownerUserId: otherOwner._id,
      propertyId: otherProperty._id,
      title: "Other report",
      status: "ready",
      file: {
        key: "reports/other/report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 12
      }
    });
    const accessToken = await login(owner.email);

    const createResponse = await request(app)
      .post(`/api/reports/property/${otherProperty._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    const detailResponse = await request(app)
      .get(`/api/reports/${otherReport._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(createResponse.status).toBe(404);
    expect(detailResponse.status).toBe(404);
  });

  it("enforces the monthly report limit", async () => {
    const owner = await createUser();
    const property = await createProperty(owner._id);
    await Report.create(
      [0, 1, 2].map((index) => ({
        ownerUserId: owner._id,
        propertyId: property._id,
        title: `Existing report ${index}`,
        status: "ready",
        type: "property_investor_pdf"
      }))
    );
    const accessToken = await login(owner.email);

    const response = await request(app)
      .post(`/api/reports/property/${property._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Monthly report limit reached for your plan (3).");
  });

  it("marks reports failed when PDF generation fails", async () => {
    jest
      .spyOn(pdfService, "generatePropertyReportPdf")
      .mockRejectedValue(new Error("PDF generation exploded"));
    const owner = await createUser();
    const property = await createProperty(owner._id);
    const accessToken = await login(owner.email);

    const response = await request(app)
      .post(`/api/reports/property/${property._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    const report = await Report.findOne({ ownerUserId: owner._id, propertyId: property._id });

    expect(response.status).toBe(500);
    expect(response.body.details.reportId).toBe(report._id.toString());
    expect(report.status).toBe("failed");
    expect(report.errorMessage).toBe("PDF generation exploded");
  });
});
