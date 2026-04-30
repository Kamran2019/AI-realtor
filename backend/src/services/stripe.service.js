const Stripe = require("stripe");

const env = require("../config/env");
const ApiError = require("../utils/ApiError");

let stripeClient = null;

const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ApiError(502, "Billing provider is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

const wrapStripeFailure = async (operation) => {
  try {
    return await operation(getStripe());
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "Billing provider request failed.");
  }
};

const createCustomer = ({ email, metadata, name }) =>
  wrapStripeFailure((stripe) =>
    stripe.customers.create({
      email,
      metadata,
      name
    })
  );

const createCheckoutSession = ({
  cancelUrl,
  customerId,
  metadata,
  priceId,
  successUrl,
  userId
}) =>
  wrapStripeFailure((stripe) =>
    stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      metadata,
      mode: "subscription",
      subscription_data: {
        metadata
      },
      success_url: successUrl
    })
  );

const createPortalSession = ({ customerId, returnUrl }) =>
  wrapStripeFailure((stripe) =>
    stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    })
  );

const constructWebhookEvent = ({ payload, signature }) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError(502, "Billing webhook is not configured.");
  }

  try {
    return getStripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    throw new ApiError(400, "Invalid Stripe webhook signature.");
  }
};

module.exports = {
  constructWebhookEvent,
  createCheckoutSession,
  createCustomer,
  createPortalSession
};
