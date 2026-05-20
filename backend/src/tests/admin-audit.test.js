const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

jest.mock("../services/report.service", () => ({
  getReportFile: jest.fn().mockResolvedValue({
    buffer: Buffer.from("pdf"),
    fileName: "report.pdf",
    mimeType: "application/pdf"
  }),
  generatePropertyReport: jest.fn(),
  getReport: jest.fn(),
  listReports: jest.fn()
}));

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");
const { signAccessToken } = require("../services/token.service");

const createUser = async (overrides = {}) =>
  User.create({
    name: "Test User",
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    passwordHash: await hashPassword("Str0ngPass!"),
    role: "user",
    status: "active",
    emailVerification: {
      isVerified: true,
      tokenHash: null,
      expiresAt: null,
      verifiedAt: new Date()
    },
    ...overrides
  });

const authHeaderFor = (user) => ({ Authorization: `Bearer ${signAccessToken(user)}` });

describe("Admin dashboard and audit logs", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await User.syncIndexes();
    await AuditLog.syncIndexes();
  }, 60000);

  afterEach(async () => {
    await Promise.all([User.deleteMany({}), AuditLog.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("admin dashboard works", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });

    const response = await request(app).get("/api/admin/dashboard").set(authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(response.body.data.metrics).toBeTruthy();
  });

  it("sub_admin dashboard works", async () => {
    const subAdmin = await createUser({ role: "sub_admin", email: "sub@example.com" });

    const response = await request(app).get("/api/admin/dashboard").set(authHeaderFor(subAdmin));

    expect(response.status).toBe(200);
  });

  it("user forbidden from dashboard", async () => {
    const user = await createUser({ role: "user", email: "user@example.com" });

    const response = await request(app).get("/api/admin/dashboard").set(authHeaderFor(user));

    expect(response.status).toBe(403);
  });

  it("admin audit logs works", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });
    await AuditLog.create({ action: "user_created", actorRole: "admin", status: "success" });

    const response = await request(app)
      .get("/api/admin/audit-logs")
      .set(authHeaderFor(admin))
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.data.logs).toHaveLength(1);
  });

  it("sub_admin audit logs forbidden", async () => {
    const subAdmin = await createUser({ role: "sub_admin", email: "sub@example.com" });

    const response = await request(app).get("/api/admin/audit-logs").set(authHeaderFor(subAdmin));

    expect(response.status).toBe(403);
  });

  it("user creation logs and excludes secrets in meta", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });

    const response = await request(app).post("/api/users").set(authHeaderFor(admin)).send({
      name: "Audited User",
      email: "audited@example.com",
      password: "SecretPass123!",
      role: "user"
    });

    expect(response.status).toBe(201);

    const auditEntry = await AuditLog.findOne({ action: "user_created" }).sort({ createdAt: -1, _id: -1 });

    expect(auditEntry).toBeTruthy();
    expect(JSON.stringify(auditEntry.meta || {})).not.toContain("password");
    expect(JSON.stringify(auditEntry.meta || {})).not.toContain("token");
  });

  it("report share logs", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });
    const reportId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/reports/${reportId}/download`)
      .set(authHeaderFor(admin));

    expect(response.status).toBe(200);

    const auditEntry = await AuditLog.findOne({ action: "report_shared", entityId: reportId });

    expect(auditEntry).toBeTruthy();
    expect(auditEntry.status).toBe("success");
  });
});
