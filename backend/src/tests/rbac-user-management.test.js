const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");
const { signAccessToken } = require("../services/token.service");
const { hashToken } = require("../services/tokenHash.service");

const password = "Str0ngPass!";

const createUser = async (overrides = {}) =>
  User.create({
    name: "Test User",
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    passwordHash: await hashPassword(password),
    role: "user",
    status: "active",
    ...overrides
  });

const authHeaderFor = (user) => ({
  Authorization: `Bearer ${signAccessToken(user)}`
});

describe("RBAC user management API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await User.syncIndexes();
  }, 60000);

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("admin lists users", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });
    await createUser({ name: "Managed User", email: "managed@example.com" });

    const response = await request(app).get("/api/users").set(authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(response.body.data.users).toHaveLength(2);
    expect(response.body.data.pagination.total).toBe(2);
  });

  it("sub_admin lists users", async () => {
    const subAdmin = await createUser({ role: "sub_admin", email: "sub@example.com" });
    await createUser({ email: "managed@example.com" });

    const response = await request(app).get("/api/users").set(authHeaderFor(subAdmin));

    expect(response.status).toBe(200);
    expect(response.body.data.users).toHaveLength(2);
  });

  it("user is forbidden from user management", async () => {
    const user = await createUser({ role: "user", email: "user@example.com" });

    const response = await request(app).get("/api/users").set(authHeaderFor(user));

    expect(response.status).toBe(403);
  });

  it("admin creates sub_admin and user accounts", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });

    const subAdminResponse = await request(app)
      .post("/api/users")
      .set(authHeaderFor(admin))
      .send({
        name: "Sub Admin",
        email: "new-sub@example.com",
        password,
        role: "sub_admin"
      });
    const userResponse = await request(app).post("/api/users").set(authHeaderFor(admin)).send({
      name: "New User",
      email: "new-user@example.com",
      password,
      role: "user"
    });

    expect(subAdminResponse.status).toBe(201);
    expect(subAdminResponse.body.data.user.role).toBe("sub_admin");
    expect(userResponse.status).toBe(201);
    expect(userResponse.body.data.user.role).toBe("user");
  });

  it("admin cannot create another admin", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });

    const response = await request(app).post("/api/users").set(authHeaderFor(admin)).send({
      name: "New Admin",
      email: "new-admin@example.com",
      password,
      role: "admin"
    });

    expect(response.status).toBe(400);
  });

  it("sub_admin cannot create users", async () => {
    const subAdmin = await createUser({ role: "sub_admin", email: "sub@example.com" });

    const response = await request(app).post("/api/users").set(authHeaderFor(subAdmin)).send({
      name: "Blocked User",
      email: "blocked@example.com",
      password,
      role: "user"
    });

    expect(response.status).toBe(403);
  });

  it("self-disable is blocked", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });
    await createUser({ role: "admin", email: "other-admin@example.com" });

    const statusResponse = await request(app)
      .patch(`/api/users/${admin.id}/status`)
      .set(authHeaderFor(admin))
      .send({ status: "disabled" });
    const updateResponse = await request(app)
      .patch(`/api/users/${admin.id}`)
      .set(authHeaderFor(admin))
      .send({ status: "disabled" });

    expect(statusResponse.status).toBe(400);
    expect(statusResponse.body.message).toBe("You cannot disable your own account.");
    expect(updateResponse.status).toBe(400);
    expect(updateResponse.body.message).toBe("You cannot disable your own account.");
  });

  it("prevents disabling or downgrading the only active admin", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });

    const disableResponse = await request(app)
      .patch(`/api/users/${admin.id}/status`)
      .set(authHeaderFor(admin))
      .send({ status: "disabled" });
    const downgradeResponse = await request(app)
      .patch(`/api/users/${admin.id}`)
      .set(authHeaderFor(admin))
      .send({ role: "user" });

    expect(disableResponse.status).toBe(400);
    expect(downgradeResponse.status).toBe(400);
    expect(downgradeResponse.body.message).toBe("Cannot disable or downgrade the only active admin.");
  });

  it("response excludes sensitive hashes", async () => {
    const admin = await createUser({ role: "admin", email: "admin@example.com" });
    const target = await createUser({
      email: "target@example.com",
      auth: {
        refreshTokenHash: hashToken("refresh")
      },
      passwordReset: {
        tokenHash: hashToken("reset"),
        expiresAt: new Date(Date.now() + 1000),
        requestedAt: new Date()
      },
      emailVerification: {
        isVerified: false,
        tokenHash: hashToken("verify"),
        expiresAt: new Date(Date.now() + 1000),
        verifiedAt: null
      }
    });

    const response = await request(app).get(`/api/users/${target.id}`).set(authHeaderFor(admin));
    const responseText = JSON.stringify(response.body);

    expect(response.status).toBe(200);
    expect(responseText).not.toContain("passwordHash");
    expect(responseText).not.toContain("refreshTokenHash");
    expect(responseText).not.toContain("tokenHash");
  });
});
