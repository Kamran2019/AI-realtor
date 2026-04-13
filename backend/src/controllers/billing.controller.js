const User = require("../models/User");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { PLAN_CONFIG } = require("../config/plans");
const {
  createCheckoutSession,
  createPortalSession,
  getStripeClient,
  handleStripeEvent,
} = require("../services/stripe.service");

const getBillingSummary = asyncHandler(async (req, res) => {
  const owner = await User.findById(req.accountOwnerId);
  res.json({
    subscription: owner.subscription,
    plans: PLAN_CONFIG,
  });
});

const createCheckout = asyncHandler(async (req, res) => {
  const { plan, interval } = req.body;
  const session = await createCheckoutSession({
    user: req.user,
    plan,
    interval,
    successUrl: `${env.clientUrl}/billing?status=success`,
    cancelUrl: `${env.clientUrl}/billing?status=cancelled`,
  });

  res.json({
    url: session.url,
    id: session.id,
  });
});

const createPortal = asyncHandler(async (req, res) => {
  const session = await createPortalSession({
    user: req.user,
    returnUrl: `${env.clientUrl}/billing`,
  });

  res.json({ url: session.url });
});

const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    throw new AppError("Stripe signature is missing", 400);
  }

  const event = getStripeClient().webhooks.constructEvent(
    req.body,
    signature,
    env.stripeWebhookSecret
  );

  await handleStripeEvent(event);
  res.json({ received: true });
});

module.exports = {
  getBillingSummary,
  createCheckout,
  createPortal,
  webhook,
};
