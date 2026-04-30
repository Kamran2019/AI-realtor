const { z } = require("zod");

const env = require("../config/env");
const { BILLING_INTERVALS, PLAN_KEYS } = require("../config/plans");
const billingService = require("../services/billing.service");
const stripeService = require("../services/stripe.service");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");

const checkoutSchema = z
  .object({
    interval: z.enum(BILLING_INTERVALS),
    plan: z.enum(PLAN_KEYS)
  })
  .strict();

const emptyBodySchema = z.object({}).strict();

const formatValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join(".") || null,
    message: issue.message
  }));

const parseBody = (schema, body) => {
  const parsedBody = schema.safeParse(body || {});

  if (!parsedBody.success) {
    throw new ApiError(400, "Validation failed", formatValidationIssues(parsedBody.error.issues));
  }

  return parsedBody.data;
};

const createCheckout = asyncHandler(async (req, res) => {
  const checkout = await billingService.createCheckout({
    ...parseBody(checkoutSchema, req.body),
    appBaseUrl: env.APP_BASE_URL,
    userId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Checkout session created.",
    data: checkout
  });
});

const createPortal = asyncHandler(async (req, res) => {
  parseBody(emptyBodySchema, req.body);

  const portal = await billingService.createPortal({
    appBaseUrl: env.APP_BASE_URL,
    userId: req.user._id
  });

  sendResponse(res, 200, {
    success: true,
    message: "Billing portal session created.",
    data: portal
  });
});

const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.get("stripe-signature");

  if (!signature) {
    throw new ApiError(400, "Invalid Stripe webhook signature.");
  }

  const event = stripeService.constructWebhookEvent({
    payload: req.body,
    signature
  });

  await billingService.processWebhookEvent(event);

  sendResponse(res, 200, {
    success: true,
    message: "Webhook received.",
    data: {
      received: true
    }
  });
});

module.exports = {
  createCheckout,
  createPortal,
  handleWebhook
};
