const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const Property = require("../models/Property");
const PropertyBookmark = require("../models/PropertyBookmark");
const PropertyNote = require("../models/PropertyNote");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");

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

const createProperty = async (ownerUserId, overrides = {}) =>
  Property.create({
    ownerUserId,
    source: {
      key: "source-one",
      listingId: overrides.listingId || "bookmark-note-lot",
      url: "https://example.com/bookmark-note-lot",
      scrapedAt: new Date("2026-01-01T09:00:00.000Z")
    },
    address: {
      line1: "4 Note Street",
      city: "Manchester",
      postcode: "M1 1AE",
      country: "UK",
      ...(overrides.address || {})
    },
    prices: {
      guide: {
        amount: 220000,
        currency: "GBP"
      }
    },
    auctionDate: new Date("2026-06-15T10:00:00.000Z"),
    type: "House",
    tenure: "Freehold",
    description: "A property worth annotating.",
    status: "new",
    ...overrides
  });

describe("bookmarks and property notes API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([
      Property.syncIndexes(),
      PropertyBookmark.syncIndexes(),
      PropertyNote.syncIndexes(),
      User.syncIndexes()
    ]);
  }, 60000);

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await Promise.all([
        Property.deleteMany({}),
        PropertyBookmark.deleteMany({}),
        PropertyNote.deleteMany({}),
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

  it("toggles bookmark add and remove", async () => {
    const user = await createUser();
    const property = await createProperty(user._id);
    const accessToken = await login(user.email);

    const addResponse = await request(app)
      .post(`/api/bookmarks/${property._id}/toggle`)
      .set("Authorization", `Bearer ${accessToken}`);
    const removeResponse = await request(app)
      .post(`/api/bookmarks/${property._id}/toggle`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(addResponse.status).toBe(200);
    expect(addResponse.body.data.bookmarked).toBe(true);
    expect(removeResponse.status).toBe(200);
    expect(removeResponse.body.data.bookmarked).toBe(false);
    expect(await PropertyBookmark.countDocuments({ userId: user._id })).toBe(0);
  });

  it("keeps bookmarks unique per user and property", async () => {
    const user = await createUser();
    const property = await createProperty(user._id);

    await PropertyBookmark.create({
      propertyId: property._id,
      userId: user._id
    });

    await expect(
      PropertyBookmark.create({
        propertyId: property._id,
        userId: user._id
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("lists own bookmarks", async () => {
    const user = await createUser({ email: "owner@example.com", name: "Owner User" });
    const otherUser = await createUser({ email: "other@example.com", name: "Other User" });
    const ownProperty = await createProperty(user._id, { listingId: "own-lot" });
    const otherProperty = await createProperty(otherUser._id, { listingId: "other-lot" });
    await PropertyBookmark.create({ propertyId: ownProperty._id, userId: user._id });
    await PropertyBookmark.create({ propertyId: otherProperty._id, userId: otherUser._id });
    const accessToken = await login(user.email);

    const response = await request(app)
      .get("/api/bookmarks")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.bookmarks).toHaveLength(1);
    expect(response.body.data.bookmarks[0].propertyId).toBe(ownProperty._id.toString());
    expect(response.body.data.bookmarks[0].property.source.listingId).toBe("own-lot");
  });

  it("creates a property note", async () => {
    const user = await createUser();
    const property = await createProperty(user._id);
    const accessToken = await login(user.email);

    const response = await request(app)
      .post(`/api/properties/${property._id}/notes`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: " Check roof condition. " });

    expect(response.status).toBe(201);
    expect(response.body.data.note).toEqual(
      expect.objectContaining({
        propertyId: property._id.toString(),
        text: "Check roof condition.",
        userId: user._id.toString()
      })
    );
  });

  it("edits own note", async () => {
    const user = await createUser();
    const property = await createProperty(user._id);
    const note = await PropertyNote.create({
      propertyId: property._id,
      text: "Original note",
      userId: user._id
    });
    const accessToken = await login(user.email);

    const response = await request(app)
      .patch(`/api/notes/${note._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "Updated note" });

    expect(response.status).toBe(200);
    expect(response.body.data.note.text).toBe("Updated note");
  });

  it("prevents users from editing others' notes", async () => {
    const owner = await createUser({ email: "owner@example.com", name: "Owner User" });
    const otherUser = await createUser({ email: "other@example.com", name: "Other User" });
    const property = await createProperty(owner._id);
    const note = await PropertyNote.create({
      propertyId: property._id,
      text: "Owner note",
      userId: owner._id
    });
    const accessToken = await login(otherUser.email);

    const response = await request(app)
      .patch(`/api/notes/${note._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "Should not save" });

    expect(response.status).toBe(403);
    expect((await PropertyNote.findById(note._id)).text).toBe("Owner note");
  });

  it("allows admins to edit others' notes", async () => {
    const owner = await createUser({ email: "owner@example.com", name: "Owner User" });
    const admin = await createUser({
      email: "admin@example.com",
      name: "Admin User",
      role: "admin"
    });
    const property = await createProperty(owner._id);
    const note = await PropertyNote.create({
      propertyId: property._id,
      text: "Needs admin review",
      userId: owner._id
    });
    const accessToken = await login(admin.email);

    const response = await request(app)
      .patch(`/api/notes/${note._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "Reviewed by admin" });

    expect(response.status).toBe(200);
    expect(response.body.data.note.text).toBe("Reviewed by admin");
  });

  it("rejects empty notes", async () => {
    const user = await createUser();
    const property = await createProperty(user._id);
    const accessToken = await login(user.email);

    const response = await request(app)
      .post(`/api/properties/${property._id}/notes`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "   " });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});
