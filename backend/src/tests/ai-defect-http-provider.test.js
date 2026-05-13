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
const originalAiServiceUrl = env.AI_SERVICE_URL;
const originalAiDetectionTimeoutMs = env.AI_DETECTION_TIMEOUT_MS;
const originalFetch = global.fetch;

const microserviceSuccessResponse = {
  success: true,
  provider: "stub",
  modelVersion: "defect-microservice-stub-v1",
  detections: [
    {
      type: "crack",
      severity: "medium",
      confidence: 0.88,
      notes: "Microservice detection: crack-like defect.",
      box: { x: 10, y: 20, w: 120, h: 40 }
    }
  ]
};

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

const createInspectionDocument = async ({ actor, imageUrl = "http://images.example.com/kitchen-crack.jpg" }) =>
  Inspection.create({
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

const detectionPath = ({ imageIndex = 0, inspectionId, roomId }) =>
  `/api/ai/inspections/${inspectionId}/rooms/${roomId}/images/${imageIndex}/detect`;

const mockHttpResponse = ({ body = microserviceSuccessResponse, ok = true, status = 200 } = {}) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(body)
  });
};

const runDetection = async ({ body, imageUrl = "http://images.example.com/kitchen-crack.jpg", ok, status } = {}) => {
  mockHttpResponse({ body, ok, status });

  const user = await createUser();
  const inspection = await createInspectionDocument({ actor: user, imageUrl });
  const roomId = inspection.rooms[0]._id.toString();
  const response = await request(app)
    .post(detectionPath({ inspectionId: inspection._id, roomId }))
    .set(authHeaderFor(user));
  const savedInspection = await Inspection.findById(inspection._id);

  return {
    inspection,
    response,
    roomId,
    savedInspection
  };
};

describe("AI defect detection HTTP provider API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Inspection.syncIndexes(), User.syncIndexes()]);
  }, 60000);

  beforeEach(() => {
    env.AI_PROVIDER = "http";
    env.AI_SERVICE_URL = "http://ai-service.test:8000/";
    env.AI_DETECTION_TIMEOUT_MS = 250;
  });

  afterEach(async () => {
    env.AI_PROVIDER = originalAiProvider;
    env.AI_SERVICE_URL = originalAiServiceUrl;
    env.AI_DETECTION_TIMEOUT_MS = originalAiDetectionTimeoutMs;
    global.fetch = originalFetch;
    jest.restoreAllMocks();

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

  it("keeps AI_PROVIDER=stub on the local MERN stub path", async () => {
    env.AI_PROVIDER = "stub";
    global.fetch = jest.fn();

    const user = await createUser();
    const inspection = await createInspectionDocument({
      actor: user,
      imageUrl: "/uploads/inspections/kitchen-crack.png"
    });
    const roomId = inspection.rooms[0]._id.toString();
    const response = await request(app)
      .post(detectionPath({ inspectionId: inspection._id, roomId }))
      .set(authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.body.data.provider).toBe("stub");
    expect(response.body.data.defects[0]).toEqual(
      expect.objectContaining({
        modelVersion: "defect-stub-v1",
        source: "ai_stub",
        type: "crack"
      })
    );
  });

  it("calls AI_SERVICE_URL/detect with the expected payload", async () => {
    const imageUrl = "http://images.example.com/kitchen-crack.jpg";
    const { inspection, response, roomId } = await runDetection({ imageUrl });

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe("http://ai-service.test:8000/detect");
    expect(global.fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      })
    );
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
      imageUrl,
      imageIndex: 0,
      inspectionId: inspection._id.toString(),
      roomId
    });
    expect(global.fetch.mock.calls[0][1].signal).toBeDefined();
  });

  it("expands relative inspection image URLs for the microservice request", async () => {
    const imageUrl = "/uploads/inspections/kitchen-crack.png";
    const { response } = await runDetection({ imageUrl });

    expect(response.status).toBe(200);
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).imageUrl).toBe(
      "http://localhost:5001/uploads/inspections/kitchen-crack.png"
    );
    expect(response.body.data.defects[0].imageUrl).toBe(imageUrl);
  });

  it("normalizes HTTP detections as microservice defects", async () => {
    const { response } = await runDetection();

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        modelVersion: "defect-microservice-stub-v1",
        provider: "http"
      })
    );
    expect(response.body.data.defects[0]).toEqual(
      expect.objectContaining({
        box: { x: 10, y: 20, w: 120, h: 40 },
        confidence: 0.88,
        imageUrl: "http://images.example.com/kitchen-crack.jpg",
        modelVersion: "defect-microservice-stub-v1",
        notes: "Microservice detection: crack-like defect.",
        severity: "medium",
        source: "ai_microservice",
        type: "crack"
      })
    );
  });

  it("saves HTTP detections into the inspection", async () => {
    const { response, savedInspection } = await runDetection();

    expect(response.status).toBe(200);
    expect(savedInspection.rooms[0].defects).toHaveLength(1);
    expect(savedInspection.rooms[0].defects[0]).toEqual(
      expect.objectContaining({
        confidence: 0.88,
        modelVersion: "defect-microservice-stub-v1",
        source: "ai_microservice",
        type: "crack"
      })
    );
  });

  it("returns 504 and saves no defects when the AI service times out", async () => {
    global.fetch = jest.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));

    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    const roomId = inspection.rooms[0]._id.toString();
    const response = await request(app)
      .post(detectionPath({ inspectionId: inspection._id, roomId }))
      .set(authHeaderFor(user));
    const savedInspection = await Inspection.findById(inspection._id);

    expect(response.status).toBe(504);
    expect(response.body.message).toBe("AI detection service timed out.");
    expect(savedInspection.rooms[0].defects).toHaveLength(0);
  });

  it("returns 502 and saves no defects when the AI service is unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

    const user = await createUser();
    const inspection = await createInspectionDocument({ actor: user });
    const roomId = inspection.rooms[0]._id.toString();
    const response = await request(app)
      .post(detectionPath({ inspectionId: inspection._id, roomId }))
      .set(authHeaderFor(user));
    const savedInspection = await Inspection.findById(inspection._id);

    expect(response.status).toBe(502);
    expect(response.body.message).toBe("AI detection service is currently unavailable.");
    expect(savedInspection.rooms[0].defects).toHaveLength(0);
  });

  it("returns 502 and saves no defects for non-2xx AI responses", async () => {
    const { response, savedInspection } = await runDetection({
      body: { detail: "provider failed" },
      ok: false,
      status: 502
    });

    expect(response.status).toBe(502);
    expect(response.body.message).toBe("AI detection service is currently unavailable.");
    expect(savedInspection.rooms[0].defects).toHaveLength(0);
  });

  it("returns 502 and saves no defects for invalid AI response schema", async () => {
    const { response, savedInspection } = await runDetection({
      body: {
        success: true,
        provider: "stub",
        modelVersion: "defect-microservice-stub-v1",
        detections: [
          {
            type: "unknown",
            severity: "medium",
            confidence: 0.5
          }
        ]
      }
    });

    expect(response.status).toBe(502);
    expect(response.body.message).toBe("AI detection service returned an invalid response.");
    expect(savedInspection.rooms[0].defects).toHaveLength(0);
  });

  it("keeps the existing frontend-facing MERN route for HTTP mode", async () => {
    const { response } = await runDetection();

    expect(response.status).toBe(200);
    expect(response.body.data.defects[0].source).toBe("ai_microservice");
  });
});
