const fs = require("fs/promises");
const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");
process.env.INSPECTION_STORAGE_DIR = path.resolve(__dirname, "../../.tmp/inspection-uploads");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const Inspection = require("../models/Inspection");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");
const { signAccessToken } = require("../services/token.service");

const password = "Str0ngPass!";
const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d
]);

const createUser = async (overrides = {}) =>
  User.create({
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    name: "Test User",
    passwordHash: await hashPassword(password),
    role: "user",
    status: "active",
    ...overrides
  });

const authHeaderFor = (user) => ({
  Authorization: `Bearer ${signAccessToken(user)}`
});

const inspectionPayload = (overrides = {}) => ({
  propertyRef: {
    address: "11 Inspection Street",
    postcode: "M1 1AA",
    ...(overrides.propertyRef || {})
  },
  client: {
    name: "Morgan Client",
    email: "morgan@example.com",
    phone: "0161 000 0000",
    ...(overrides.client || {})
  },
  ...overrides
});

const createInspectionDocument = async ({ actor, assignedToUserId = null, status = "draft" }) =>
  Inspection.create({
    assignedToUserId,
    createdByUserId: actor._id,
    ownerUserId: actor._id,
    propertyRef: {
      address: "22 Existing Road",
      postcode: "E1 1AA"
    },
    status
  });

describe("inspection workflow API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Inspection.syncIndexes(), User.syncIndexes()]);
  }, 60000);

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await Promise.all([Inspection.deleteMany({}), User.deleteMany({})]);
    }

    await fs.rm(process.env.INSPECTION_STORAGE_DIR, { force: true, recursive: true });
  });

  afterAll(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("admin can create inspection", async () => {
    const admin = await createUser({ role: "admin" });

    const response = await request(app)
      .post("/api/inspections")
      .set(authHeaderFor(admin))
      .send(inspectionPayload());

    expect(response.status).toBe(201);
    expect(response.body.data.inspection.createdByUserId).toBe(admin._id.toString());
    expect(response.body.data.inspection.status).toBe("draft");
  });

  it("sub_admin can create inspection", async () => {
    const subAdmin = await createUser({ role: "sub_admin" });

    const response = await request(app)
      .post("/api/inspections")
      .set(authHeaderFor(subAdmin))
      .send(inspectionPayload());

    expect(response.status).toBe(201);
  });

  it("user can create inspection", async () => {
    const user = await createUser();

    const response = await request(app)
      .post("/api/inspections")
      .set(authHeaderFor(user))
      .send(inspectionPayload());

    expect(response.status).toBe(201);
    expect(response.body.data.inspection.ownerUserId).toBe(user._id.toString());
  });

  it("user cannot assign inspection to another user", async () => {
    const user = await createUser({ email: "creator@example.com" });
    const assignee = await createUser({ email: "assignee@example.com" });

    const response = await request(app)
      .post("/api/inspections")
      .set(authHeaderFor(user))
      .send(inspectionPayload({ assignedToUserId: assignee._id.toString() }));

    expect(response.status).toBe(403);
  });

  it("admin can assign inspection", async () => {
    const admin = await createUser({ role: "admin" });
    const assignee = await createUser({ email: "assignee@example.com" });
    const inspection = await createInspectionDocument({ actor: admin });

    const response = await request(app)
      .patch(`/api/inspections/${inspection._id}`)
      .set(authHeaderFor(admin))
      .send({ assignedToUserId: assignee._id.toString() });

    expect(response.status).toBe(200);
    expect(response.body.data.inspection.assignedToUserId.id).toBe(assignee._id.toString());
  });

  it("user can see created inspection", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });

    const response = await request(app).get(`/api/inspections/${inspection._id}`).set(authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(response.body.data.inspection.id).toBe(inspection._id.toString());
  });

  it("assigned user can see assigned inspection", async () => {
    const admin = await createUser({ role: "admin" });
    const assignee = await createUser({ email: "assignee@example.com" });
    const inspection = await createInspectionDocument({
      actor: admin,
      assignedToUserId: assignee._id
    });

    const response = await request(app).get(`/api/inspections/${inspection._id}`).set(authHeaderFor(assignee));

    expect(response.status).toBe(200);
  });

  it("unrelated user cannot see inspection", async () => {
    const admin = await createUser({ role: "admin" });
    const unrelated = await createUser({ email: "unrelated@example.com" });
    const inspection = await createInspectionDocument({ actor: admin });

    const response = await request(app).get(`/api/inspections/${inspection._id}`).set(authHeaderFor(unrelated));

    expect(response.status).toBe(403);
  });

  it("add room works", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });

    const response = await request(app)
      .post(`/api/inspections/${inspection._id}/rooms`)
      .set(authHeaderFor(user))
      .send({ name: "Kitchen", notes: "Check sink wall." });

    expect(response.status).toBe(201);
    expect(response.body.data.inspection.rooms[0].name).toBe("Kitchen");
  });

  it("update room works", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    inspection.rooms.push({ name: "Kitchen" });
    await inspection.save();
    const roomId = inspection.rooms[0]._id;

    const response = await request(app)
      .patch(`/api/inspections/${inspection._id}/rooms/${roomId}`)
      .set(authHeaderFor(user))
      .send({ notes: "Updated room notes." });

    expect(response.status).toBe(200);
    expect(response.body.data.inspection.rooms[0].notes).toBe("Updated room notes.");
  });

  it("upload valid image works", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    inspection.rooms.push({ name: "Bathroom" });
    await inspection.save();
    const roomId = inspection.rooms[0]._id;

    const response = await request(app)
      .post(`/api/inspections/${inspection._id}/rooms/${roomId}/images`)
      .set(authHeaderFor(user))
      .attach("image", pngBuffer, {
        contentType: "image/png",
        filename: "bathroom.png"
      });

    expect(response.status).toBe(200);
    expect(response.body.data.image.url).toMatch(/^\/uploads\/inspections\/inspection_/);
    expect(response.body.data.inspection.rooms[0].mediaUrls).toHaveLength(1);
  });

  it("invalid image MIME rejected", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    inspection.rooms.push({ name: "Hall" });
    await inspection.save();
    const roomId = inspection.rooms[0]._id;

    const response = await request(app)
      .post(`/api/inspections/${inspection._id}/rooms/${roomId}/images`)
      .set(authHeaderFor(user))
      .attach("image", Buffer.from("<svg></svg>"), {
        contentType: "image/svg+xml",
        filename: "bad.svg"
      });

    expect(response.status).toBe(400);
  });

  it("oversized image rejected", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    inspection.rooms.push({ name: "Loft" });
    await inspection.save();
    const roomId = inspection.rooms[0]._id;
    const oversizedPng = Buffer.concat([pngBuffer, Buffer.alloc(10 * 1024 * 1024 + 1)]);

    const response = await request(app)
      .post(`/api/inspections/${inspection._id}/rooms/${roomId}/images`)
      .set(authHeaderFor(user))
      .attach("image", oversizedPng, {
        contentType: "image/png",
        filename: "large.png"
      });

    expect(response.status).toBe(400);
  });

  it("add manual defect works", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    inspection.rooms.push({ name: "Bedroom" });
    await inspection.save();
    const roomId = inspection.rooms[0]._id;

    const response = await request(app)
      .post(`/api/inspections/${inspection._id}/rooms/${roomId}/defects`)
      .set(authHeaderFor(user))
      .send({ severity: "high", notes: "Ceiling crack", type: "crack" });

    expect(response.status).toBe(201);
    expect(response.body.data.inspection.rooms[0].defects[0]).toEqual(
      expect.objectContaining({
        severity: "high",
        source: "manual",
        type: "crack"
      })
    );
  });

  it("update manual defect works", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    inspection.rooms.push({
      defects: [{ severity: "low", type: "stain" }],
      name: "Living room"
    });
    await inspection.save();
    const roomId = inspection.rooms[0]._id;
    const defectId = inspection.rooms[0].defects[0]._id;

    const response = await request(app)
      .patch(`/api/inspections/${inspection._id}/rooms/${roomId}/defects/${defectId}`)
      .set(authHeaderFor(user))
      .send({ notes: "Escalated after review", severity: "medium" });

    expect(response.status).toBe(200);
    expect(response.body.data.inspection.rooms[0].defects[0].severity).toBe("medium");
    expect(response.body.data.inspection.rooms[0].defects[0].notes).toBe("Escalated after review");
  });

  it("delete manual defect works", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    inspection.rooms.push({
      defects: [{ severity: "low", type: "stain" }],
      name: "Living room"
    });
    await inspection.save();
    const roomId = inspection.rooms[0]._id;
    const defectId = inspection.rooms[0].defects[0]._id;

    const response = await request(app)
      .delete(`/api/inspections/${inspection._id}/rooms/${roomId}/defects/${defectId}`)
      .set(authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(response.body.data.inspection.rooms[0].defects).toHaveLength(0);
  });

  it("summary counts update after add, update, and delete defect", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    inspection.rooms.push({ name: "Utility" });
    await inspection.save();
    const roomId = inspection.rooms[0]._id;

    const addResponse = await request(app)
      .post(`/api/inspections/${inspection._id}/rooms/${roomId}/defects`)
      .set(authHeaderFor(user))
      .send({ severity: "low", type: "damp" });
    const defectId = addResponse.body.data.inspection.rooms[0].defects[0].id;

    expect(addResponse.body.data.inspection.summary).toEqual(
      expect.objectContaining({ high: 0, low: 1, medium: 0, totalDefects: 1 })
    );

    const updateResponse = await request(app)
      .patch(`/api/inspections/${inspection._id}/rooms/${roomId}/defects/${defectId}`)
      .set(authHeaderFor(user))
      .send({ severity: "high" });

    expect(updateResponse.body.data.inspection.summary).toEqual(
      expect.objectContaining({ high: 1, low: 0, medium: 0, totalDefects: 1 })
    );

    const deleteResponse = await request(app)
      .delete(`/api/inspections/${inspection._id}/rooms/${roomId}/defects/${defectId}`)
      .set(authHeaderFor(user));

    expect(deleteResponse.body.data.inspection.summary).toEqual(
      expect.objectContaining({ high: 0, low: 0, medium: 0, totalDefects: 0 })
    );
  });

  it("valid status transition works", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });

    const response = await request(app)
      .patch(`/api/inspections/${inspection._id}/status`)
      .set(authHeaderFor(user))
      .send({ status: "in_progress" });

    expect(response.status).toBe(200);
    expect(response.body.data.inspection.status).toBe("in_progress");
  });

  it("invalid status transition rejected", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });

    const response = await request(app)
      .patch(`/api/inspections/${inspection._id}/status`)
      .set(authHeaderFor(user))
      .send({ status: "completed" });

    expect(response.status).toBe(400);
  });

  it("list filters by status", async () => {
    const user = await createUser();
    await createInspectionDocument({ actor: user, status: "draft" });
    await createInspectionDocument({ actor: user, status: "in_progress" });

    const response = await request(app)
      .get("/api/inspections?status=in_progress")
      .set(authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(response.body.data.inspections).toHaveLength(1);
    expect(response.body.data.inspections[0].status).toBe("in_progress");
  });
});
