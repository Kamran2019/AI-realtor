const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");

const validPassword = "Str0ngPass!";
const validLogin = {
  email: "grace@example.com",
  password: validPassword
};

const createUser = async (overrides = {}) =>
  User.create({
    name: "Grace Hopper",
    email: validLogin.email,
    passwordHash: await hashPassword(validPassword),
    ...overrides
  });

const getRefreshCookie = (response) =>
  response.headers["set-cookie"]?.find((cookie) => cookie.startsWith("refreshToken="));

const getRefreshCookiePair = (response) => getRefreshCookie(response)?.split(";")[0];

const expectClearedRefreshCookie = (response) => {
  const refreshCookie = getRefreshCookie(response);

  expect(refreshCookie).toBeDefined();
  expect(refreshCookie).toContain("refreshToken=;");
};

describe("auth login/session API", () => {
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

  it("valid login returns access token and sets refresh cookie", async () => {
    await createUser();

    const response = await request(app).post("/api/auth/login").send(validLogin);
    const user = await User.findOne({ email: validLogin.email }).select("+auth.refreshTokenHash");

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe(validLogin.email);
    expect(getRefreshCookie(response)).toContain("HttpOnly");
    expect(user.auth.refreshTokenHash).toEqual(expect.any(String));
    expect(user.auth.refreshTokenHash).not.toBe(getRefreshCookiePair(response));
  });

  it("wrong password returns 401", async () => {
    await createUser();

    const response = await request(app)
      .post("/api/auth/login")
      .send({ ...validLogin, password: "WrongPass1!" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password.");
  });

  it("unknown email returns 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ ...validLogin, email: "missing@example.com" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password.");
  });

  it("disabled user returns 403", async () => {
    await createUser({ status: "disabled" });

    const response = await request(app).post("/api/auth/login").send(validLogin);

    expect(response.status).toBe(403);
  });

  it("me works with token", async () => {
    await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send(validLogin);
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(validLogin.email);
  });

  it("refresh works with cookie", async () => {
    await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send(validLogin);
    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [getRefreshCookiePair(loginResponse)]);

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe(validLogin.email);
  });

  it("logout clears cookie and refresh hash", async () => {
    await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send(validLogin);
    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [getRefreshCookiePair(loginResponse)]);
    const user = await User.findOne({ email: validLogin.email }).select("+auth.refreshTokenHash");

    expect(logoutResponse.status).toBe(200);
    expectClearedRefreshCookie(logoutResponse);
    expect(user.auth.refreshTokenHash).toBeNull();
  });

  it("responses exclude passwordHash", async () => {
    await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send(validLogin);
    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`);

    expect(loginResponse.body.data.user.passwordHash).toBeUndefined();
    expect(meResponse.body.data.user.passwordHash).toBeUndefined();
  });

  it("invalid refresh clears cookie and returns 401", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", ["refreshToken=invalid"]);

    expect(response.status).toBe(401);
    expectClearedRefreshCookie(response);
  });
});
