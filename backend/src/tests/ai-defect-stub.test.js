const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const env = require("../config/env");
const Inspection = require("../models/Inspection");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");
const { signAccessToken } = require("../services/token.service");

const password = "Str0ngPass!";
const originalAiProvider = env.AI_PROVIDER;

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

const createInspectionDocument = async ({ actor, imageUrl = "/uploads/inspections/plain-wall.png" }) => {
  const inspection = await Inspection.create({
    createdByUserId: actor._id,
    ownerUserId: actor._id,
    propertyRef: {
      address: "22 Existing Road",
      postcode: "E1 1AA"
    },
    rooms: [
      {
        mediaUrls: [imageUrl],
        name: "Kitchen"
      }
    ]
  });

  return inspection;
};

const detectionPath = ({ imageIndex = 0, inspectionId, roomId }) =>
  `/api/ai/inspections/${inspectionId}/rooms/${roomId}/images/${imageIndex}/detect`;

const runDetectionForImage = async (imageUrl) => {
  const user = await createUser();
  const inspection = await createInspectionDocument({ actor: user, imageUrl });
  const roomId = inspection.rooms[0]._id.toString();

  return request(app)
    .post(detectionPath({ inspectionId: inspection._id, roomId }))
    .set(authHeaderFor(user));
};

describe("AI defect detection stub API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Inspection.syncIndexes(), User.syncIndexes()]);
  }, 60000);

  afterEach(async () => {
    env.AI_PROVIDER = originalAiProvider;

    if (mongoose.connection.readyState === 1) {
      await Promise.all([Inspection.deleteMany({}), User.deleteMany({})]);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("requires auth", async () => {
    const inspectionId = new mongoose.Types.ObjectId();
    const roomId = new mongoose.Types.ObjectId();

    const response = await request(app).post(detectionPath({ inspectionId, roomId }));

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid inspection ID", async () => {
    const user = await createUser();
    const roomId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post(detectionPath({ inspectionId: "bad-id", roomId }))
      .set(authHeaderFor(user));

    expect(response.status).toBe(400);
  });

  it("returns 404 for missing inspection", async () => {
    const user = await createUser();
    const inspectionId = new mongoose.Types.ObjectId();
    const roomId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post(detectionPath({ inspectionId, roomId }))
      .set(authHeaderFor(user));

    expect(response.status).toBe(404);
  });

  it("returns 404 for missing room", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    const roomId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post(detectionPath({ inspectionId: inspection._id, roomId }))
      .set(authHeaderFor(user));

    expect(response.status).toBe(404);
  });

  it("returns 404 for missing image index", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    const roomId = inspection.rooms[0]._id.toString();

    const response = await request(app)
      .post(detectionPath({ imageIndex: 3, inspectionId: inspection._id, roomId }))
      .set(authHeaderFor(user));

    expect(response.status).toBe(404);
  });

  it("prevents detection on inaccessible inspections", async () => {
    const owner = await createUser();
    const unrelated = await createUser();
    const inspection = await createInspectionDocument({ actor: owner });
    const roomId = inspection.rooms[0]._id.toString();

    const response = await request(app)
      .post(detectionPath({ inspectionId: inspection._id, roomId }))
      .set(authHeaderFor(unrelated));

    expect(response.status).toBe(403);
  });

  it("returns crack when image URL contains crack", async () => {
    const response = await runDetectionForImage("/uploads/inspections/kitchen-crack.png");

    expect(response.status).toBe(200);
    expect(response.body.data.defects[0]).toEqual(
      expect.objectContaining({
        confidence: 0.78,
        modelVersion: "defect-stub-v1",
        severity: "medium",
        source: "ai_stub",
        type: "crack"
      })
    );
  });

  it("returns damp when image URL contains damp", async () => {
    const response = await runDetectionForImage("/uploads/inspections/bathroom-damp.png");

    expect(response.status).toBe(200);
    expect(response.body.data.defects[0].type).toBe("damp");
  });

  it.each([
    ["/uploads/inspections/loft-mould.png"],
    ["/uploads/inspections/loft-mold.png"]
  ])("returns mould when image URL contains mould or mold: %s", async (imageUrl) => {
    const response = await runDetectionForImage(imageUrl);

    expect(response.status).toBe(200);
    expect(response.body.data.defects[0].type).toBe("mould");
  });

  it("returns poor_finish by default", async () => {
    const response = await runDetectionForImage("/uploads/inspections/plain-wall.png");

    expect(response.status).toBe(200);
    expect(response.body.data.defects[0]).toEqual(
      expect.objectContaining({
        severity: "low",
        type: "poor_finish"
      })
    );
  });

  it("saves returned defects to the inspection", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({
      actor: user,
      imageUrl: "/uploads/inspections/wall-crack.png"
    });
    const roomId = inspection.rooms[0]._id.toString();

    const response = await request(app)
      .post(detectionPath({ inspectionId: inspection._id, roomId }))
      .set(authHeaderFor(user));
    const savedInspection = await Inspection.findById(inspection._id);

    expect(response.status).toBe(200);
    expect(savedInspection.rooms[0].defects).toHaveLength(1);
    expect(savedInspection.rooms[0].defects[0].type).toBe("crack");
  });

  it("updates summary counts after detection", async () => {
    const response = await runDetectionForImage("/uploads/inspections/wall-crack.png");

    expect(response.status).toBe(200);
    expect(response.body.data.summary).toEqual(
      expect.objectContaining({
        high: 0,
        low: 0,
        medium: 1,
        totalDefects: 1
      })
    );
  });

  it("keeps confidence, model version, and source server-controlled", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({
      actor: user,
      imageUrl: "/uploads/inspections/wall-crack.png"
    });
    const roomId = inspection.rooms[0]._id.toString();

    const response = await request(app)
      .post(detectionPath({ inspectionId: inspection._id, roomId }))
      .set(authHeaderFor(user))
      .send({
        confidence: 1,
        modelVersion: "client-controlled",
        source: "manual"
      });

    expect(response.status).toBe(200);
    expect(response.body.data.defects[0]).toEqual(
      expect.objectContaining({
        confidence: 0.78,
        modelVersion: "defect-stub-v1",
        source: "ai_stub"
      })
    );
  });

  it("fails safely when AI_PROVIDER is unsupported", async () => {
    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    const roomId = inspection.rooms[0]._id.toString();
    env.AI_PROVIDER = "unsupported";

    const response = await request(app)
      .post(detectionPath({ inspectionId: inspection._id, roomId }))
      .set(authHeaderFor(user));
    const savedInspection = await Inspection.findById(inspection._id);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Unsupported AI provider configured.");
    expect(savedInspection.rooms[0].defects).toHaveLength(0);
  });
});
