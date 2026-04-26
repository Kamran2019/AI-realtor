const request = require("supertest");
const app = require("../app");

describe("health API", () => {
  it("returns 200 for GET /api/health", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
  });

  it("includes success true", async () => {
    const response = await request(app).get("/api/health");

    expect(response.body.success).toBe(true);
  });

  it("includes service name", async () => {
    const response = await request(app).get("/api/health");

    expect(response.body.data.service).toBe("AI Realtor API");
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/api/missing");

    expect(response.status).toBe(404);
  });

  it("returns the standard error response format", async () => {
    const response = await request(app).get("/api/missing");

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
        details: null
      })
    );
  });
});
