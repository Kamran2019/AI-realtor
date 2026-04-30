process.env.STRIPE_STARTER_MONTHLY_PRICE_ID = "price_starter_monthly";
process.env.STRIPE_STARTER_YEARLY_PRICE_ID = "price_starter_yearly";
process.env.STRIPE_PRO_MONTHLY_PRICE_ID = "price_pro_monthly";
process.env.STRIPE_PRO_YEARLY_PRICE_ID = "price_pro_yearly";
process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID = "price_enterprise_monthly";
process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID = "price_enterprise_yearly";

jest.mock("../services/stripe.service", () => ({
  constructWebhookEvent: jest.fn(),
  createCheckoutSession: jest.fn(),
  createCustomer: jest.fn(),
  createPortalSession: jest.fn()
}));

const mongoose = require("mongoose");
const path = require("path");

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../../.cache/mongodb-binaries");

const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

const app = require("../app");
const User = require("../models/User");
const { hashPassword } = require("../services/password.service");
const stripeService = require("../services/stripe.service");
const ApiError = require("../utils/ApiError");

const validPassword = "Str0ngPass!";

const createUser = async (overrides = {}) =>
  User.create({
    email: "billing@example.com",
    name: "Billing User",
    passwordHash: await hashPassword(validPassword),
    ...overrides
  });

const login = async (email = "billing@example.com") => {
  const response = await request(app).post("/api/auth/login").send({
    email,
    password: validPassword
  });

  return response.body.data.accessToken;
};

describe("billing API", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await User.syncIndexes();
  }, 60000);

  beforeEach(() => {
    jest.clearAllMocks();
    stripeService.createCustomer.mockResolvedValue({ id: "cus_test_123" });
    stripeService.createCheckoutSession.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.test/session"
    });
    stripeService.createPortalSession.mockResolvedValue({
      id: "bps_test_123",
      url: "https://billing.stripe.test/session"
    });
  });

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

  it("checkout works", async () => {
    const user = await createUser();
    const accessToken = await login();

    const response = await request(app)
      .post("/api/billing/checkout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ interval: "monthly", plan: "starter" });
    const updatedUser = await User.findById(user._id).select("+subscription.stripeCustomerId");

    expect(response.status).toBe(200);
    expect(response.body.data.url).toBe("https://checkout.stripe.test/session");
    expect(updatedUser.subscription.stripeCustomerId).toBe("cus_test_123");
    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "cus_test_123",
        priceId: "price_starter_monthly"
      })
    );
  });

  it("invalid plan returns 400", async () => {
    await createUser();
    const accessToken = await login();

    const response = await request(app)
      .post("/api/billing/checkout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ interval: "monthly", plan: "vip" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("blocks unauthenticated checkout", async () => {
    const response = await request(app)
      .post("/api/billing/checkout")
      .send({ interval: "monthly", plan: "starter" });

    expect(response.status).toBe(401);
  });

  it("portal requires a Stripe customer", async () => {
    await createUser();
    const accessToken = await login();

    const response = await request(app)
      .post("/api/billing/portal")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Stripe customer is required.");
  });

  it("invalid webhook signature returns 400", async () => {
    stripeService.constructWebhookEvent.mockImplementation(() => {
      throw new ApiError(400, "Invalid Stripe webhook signature.");
    });

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "bad_sig")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ id: "evt_bad" }));

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid Stripe webhook signature.");
  });

  it("webhook updates subscription", async () => {
    const user = await createUser({
      subscription: {
        plan: "free",
        status: "inactive",
        stripeCustomerId: "cus_test_123"
      }
    });
    const periodEnd = Math.floor(Date.now() / 1000) + 86400;

    stripeService.constructWebhookEvent.mockReturnValue({
      data: {
        object: {
          customer: "cus_test_123",
          current_period_end: periodEnd,
          id: "sub_test_123",
          items: {
            data: [{ price: { id: "price_pro_monthly" } }]
          },
          status: "active"
        }
      },
      type: "customer.subscription.updated"
    });

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "valid_sig")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ id: "evt_subscription" }));
    const updatedUser = await User.findById(user._id).select("+subscription.stripeSubscriptionId");

    expect(response.status).toBe(200);
    expect(updatedUser.subscription.plan).toBe("pro");
    expect(updatedUser.subscription.status).toBe("active");
    expect(updatedUser.subscription.stripeSubscriptionId).toBe("sub_test_123");
    expect(updatedUser.subscription.currentPeriodEnd).toEqual(new Date(periodEnd * 1000));
  });

  it("payment failure stores billing status", async () => {
    const user = await createUser({
      subscription: {
        plan: "starter",
        status: "active",
        stripeCustomerId: "cus_test_123",
        stripeSubscriptionId: "sub_test_123"
      }
    });

    stripeService.constructWebhookEvent.mockReturnValue({
      data: {
        object: {
          customer: "cus_test_123",
          subscription: "sub_test_123"
        }
      },
      type: "invoice.payment_failed"
    });

    const response = await request(app)
      .post("/api/billing/webhook")
      .set("stripe-signature", "valid_sig")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ id: "evt_invoice_failed" }));
    const updatedUser = await User.findById(user._id);

    expect(response.status).toBe(200);
    expect(updatedUser.subscription.status).toBe("payment_failed");
  });
});
