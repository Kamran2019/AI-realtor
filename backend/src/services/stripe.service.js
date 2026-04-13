const Stripe = require("stripe");
const env = require("../config/env");
const User = require("../models/User");
const { getPriceId, PLAN_CONFIG } = require("../config/plans");
const AppError = require("../utils/AppError");

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

function getStripeClient() {
  if (!stripe) {
    throw new AppError("Stripe is not configured", 503);
  }
  return stripe;
}

function priceIdToPlan(priceId) {
  const entries = Object.entries(PLAN_CONFIG);
  for (const [plan, config] of entries) {
    for (const [interval, candidatePriceId] of Object.entries(config.prices || {})) {
      if (candidatePriceId === priceId) {
        return { plan, interval };
      }
    }
  }
  return { plan: "free", interval: null };
}

async function ensureCustomer(user) {
  const owner = await User.findById(user.ownerUserId || user._id);

  if (owner.subscription?.stripeCustomerId) {
    return owner;
  }

  const customer = await getStripeClient().customers.create({
    email: owner.email,
    name: owner.name,
    metadata: {
      ownerUserId: owner._id.toString(),
    },
  });

  owner.subscription = {
    ...owner.subscription,
    stripeCustomerId: customer.id,
  };
  await owner.save();
  return owner;
}

async function createCheckoutSession({ user, plan, interval, successUrl, cancelUrl }) {
  if (plan === "free") {
    throw new Error("Free plan does not require checkout");
  }

  const priceId = getPriceId(plan, interval);
  if (!priceId) {
    throw new Error("Price is not configured for that plan");
  }

  const owner = await ensureCustomer(user);
  const session = await getStripeClient().checkout.sessions.create({
    mode: "subscription",
    customer: owner.subscription.stripeCustomerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      ownerUserId: owner._id.toString(),
      plan,
      interval,
    },
  });

  return session;
}

async function createPortalSession({ user, returnUrl }) {
  const owner = await ensureCustomer(user);

  return getStripeClient().billingPortal.sessions.create({
    customer: owner.subscription.stripeCustomerId,
    return_url: returnUrl,
  });
}

async function syncOwnerSubscription({
  customerId,
  subscriptionId,
  status,
  currentPeriodEnd,
  trialEndsAt,
  cancelAtPeriodEnd,
  lastInvoiceId,
  lastPaymentError,
  items,
}) {
  const owner = await User.findOne({
    "subscription.stripeCustomerId": customerId,
  });

  if (!owner) {
    return null;
  }

  const firstItem = items?.data?.[0];
  const priceId = firstItem?.price?.id;
  const { plan, interval } = priceIdToPlan(priceId);

  owner.subscription = {
    ...owner.subscription,
    plan,
    interval,
    status: status || owner.subscription?.status || "free",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId || owner.subscription?.stripeSubscriptionId,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
    trialEndsAt: trialEndsAt ? new Date(trialEndsAt * 1000) : null,
    cancelAtPeriodEnd: !!cancelAtPeriodEnd,
    lastInvoiceId: lastInvoiceId || owner.subscription?.lastInvoiceId,
    lastPaymentError:
      lastPaymentError?.message || lastPaymentError || owner.subscription?.lastPaymentError,
  };

  await owner.save();
  return owner;
}

async function handleStripeEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription") {
        await syncOwnerSubscription({
          customerId: session.customer,
          subscriptionId: session.subscription,
          status: "active",
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await syncOwnerSubscription({
        customerId: subscription.customer,
        subscriptionId: subscription.id,
        status: subscription.status === "canceled" ? "canceled" : subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        trialEndsAt: subscription.trial_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        items: subscription.items,
      });
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      await syncOwnerSubscription({
        customerId: invoice.customer,
        subscriptionId: invoice.subscription,
        status: "active",
        currentPeriodEnd: invoice.lines?.data?.[0]?.period?.end,
        lastInvoiceId: invoice.id,
        items: { data: invoice.lines?.data || [] },
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      await syncOwnerSubscription({
        customerId: invoice.customer,
        subscriptionId: invoice.subscription,
        status: "past_due",
        currentPeriodEnd: invoice.lines?.data?.[0]?.period?.end,
        lastInvoiceId: invoice.id,
        lastPaymentError: invoice.last_finalization_error?.message || "Payment failed",
        items: { data: invoice.lines?.data || [] },
      });
      break;
    }
    default:
      break;
  }
}

module.exports = {
  getStripeClient,
  createCheckoutSession,
  createPortalSession,
  handleStripeEvent,
};
