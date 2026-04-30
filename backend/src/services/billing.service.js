const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { getPlanByPriceId, getPriceId, isPaidPlan } = require("../config/plans");
const stripeService = require("./stripe.service");

const CHECKOUT_SUCCESS_PATH = "/billing?checkout=success";
const CHECKOUT_CANCEL_PATH = "/billing?checkout=cancelled";
const BILLING_RETURN_PATH = "/billing";

const buildAppUrl = (baseUrl, path) => new URL(path, baseUrl).toString();

const getUserWithBilling = async (userId) => {
  const user = await User.findById(userId).select(
    "+subscription.stripeCustomerId +subscription.stripeSubscriptionId"
  );

  if (!user) {
    throw new ApiError(401, "Authentication required.");
  }

  return user;
};

const ensureStripeCustomer = async (user) => {
  if (user.subscription?.stripeCustomerId) {
    return user.subscription.stripeCustomerId;
  }

  const customer = await stripeService.createCustomer({
    email: user.email,
    metadata: {
      userId: user._id.toString()
    },
    name: user.name
  });

  user.set("subscription.stripeCustomerId", customer.id);
  await user.save();

  return customer.id;
};

const createCheckout = async ({ appBaseUrl, interval, plan, userId }) => {
  if (!isPaidPlan(plan)) {
    throw new ApiError(400, "Invalid billing plan.");
  }

  const priceId = getPriceId(plan, interval);

  if (!priceId) {
    throw new ApiError(502, "Billing plan is not configured.");
  }

  const user = await getUserWithBilling(userId);
  const customerId = await ensureStripeCustomer(user);
  const metadata = {
    interval,
    plan,
    userId: user._id.toString()
  };
  const session = await stripeService.createCheckoutSession({
    cancelUrl: buildAppUrl(appBaseUrl, CHECKOUT_CANCEL_PATH),
    customerId,
    metadata,
    priceId,
    successUrl: buildAppUrl(appBaseUrl, CHECKOUT_SUCCESS_PATH),
    userId: user._id.toString()
  });

  return {
    url: session.url
  };
};

const createPortal = async ({ appBaseUrl, userId }) => {
  const user = await getUserWithBilling(userId);
  const customerId = user.subscription?.stripeCustomerId;

  if (!customerId) {
    throw new ApiError(400, "Stripe customer is required.");
  }

  const session = await stripeService.createPortalSession({
    customerId,
    returnUrl: buildAppUrl(appBaseUrl, BILLING_RETURN_PATH)
  });

  return {
    url: session.url
  };
};

const getSubscriptionPlan = (subscription) => {
  const metadataPlan = subscription.metadata?.plan;

  if (isPaidPlan(metadataPlan)) {
    return metadataPlan;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const priceMatch = getPlanByPriceId(priceId);

  return priceMatch?.plan || "free";
};

const getPeriodEnd = (subscription) =>
  subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;

const findUserForStripeObject = async ({ customerId, userId }) => {
  if (userId) {
    const user = await User.findById(userId).select(
      "+subscription.stripeCustomerId +subscription.stripeSubscriptionId"
    );

    if (user) {
      return user;
    }
  }

  if (!customerId) {
    return null;
  }

  return User.findOne({ "subscription.stripeCustomerId": customerId }).select(
    "+subscription.stripeCustomerId +subscription.stripeSubscriptionId"
  );
};

const syncSubscription = async (subscription) => {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  const user = await findUserForStripeObject({
    customerId,
    userId: subscription.metadata?.userId
  });

  if (!user) {
    return null;
  }

  const isDeleted = subscription.status === "canceled" || subscription.status === "incomplete_expired";

  user.set("subscription.plan", isDeleted ? "free" : getSubscriptionPlan(subscription));
  user.set("subscription.status", subscription.status || "inactive");
  user.set("subscription.stripeCustomerId", customerId || user.subscription?.stripeCustomerId);
  user.set("subscription.stripeSubscriptionId", isDeleted ? null : subscription.id);
  user.set("subscription.currentPeriodEnd", isDeleted ? null : getPeriodEnd(subscription));
  await user.save();

  return user.toJSON();
};

const syncCheckoutSession = async (session) => {
  if (session.mode !== "subscription") {
    return null;
  }

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const user = await findUserForStripeObject({
    customerId,
    userId: session.metadata?.userId || session.client_reference_id
  });

  if (!user) {
    return null;
  }

  if (session.metadata?.plan && isPaidPlan(session.metadata.plan)) {
    user.set("subscription.plan", session.metadata.plan);
  }

  user.set("subscription.status", "checkout_completed");
  user.set("subscription.stripeCustomerId", customerId || user.subscription?.stripeCustomerId);
  user.set("subscription.stripeSubscriptionId", subscriptionId || user.subscription?.stripeSubscriptionId);
  await user.save();

  return user.toJSON();
};

const markPaymentFailed = async (invoice) => {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  const user = await findUserForStripeObject({
    customerId,
    userId: invoice.metadata?.userId
  });

  if (!user) {
    return null;
  }

  user.set("subscription.status", "payment_failed");

  if (customerId) {
    user.set("subscription.stripeCustomerId", customerId);
  }

  if (subscriptionId) {
    user.set("subscription.stripeSubscriptionId", subscriptionId);
  }

  await user.save();

  return user.toJSON();
};

const processWebhookEvent = async (event) => {
  switch (event.type) {
    case "checkout.session.completed":
      return syncCheckoutSession(event.data.object);
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return syncSubscription(event.data.object);
    case "invoice.payment_failed":
      return markPaymentFailed(event.data.object);
    default:
      return null;
  }
};

module.exports = {
  createCheckout,
  createPortal,
  processWebhookEvent
};
