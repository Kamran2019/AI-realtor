# 06 — Stripe Subscription Billing

## Feature name

Stripe subscriptions, customer portal, webhooks, and plan limits.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Implement Stripe checkout, webhook subscription sync, customer portal, and reusable feature-gating limits.

## Scope of work

Billing only. Do not implement property/inspection features.

## Files/folders to create

```text
backend/src/config/plans.js
backend/src/controllers/billing.controller.js
backend/src/services/billing.service.js
backend/src/services/stripe.service.js
backend/src/middlewares/planLimit.middleware.js
backend/src/routes/billing.routes.js
backend/src/tests/billing.test.js
frontend/src/pages/billing/BillingPage.jsx
frontend/src/services/billingApi.js
```

## Files/folders to modify

```text
backend/src/config/env.js
backend/src/app.js
backend/src/routes/index.js
frontend/src/routes/AppRoutes.jsx
```

## Backend implementation instructions

Add Stripe env vars, plan config, checkout endpoint, portal endpoint, raw-body webhook route, webhook handlers for subscription and invoice events, and server-side plan limit middleware using User.subscription.

## Frontend implementation instructions

Create `/billing` page showing current plan/status, plan cards, upgrade buttons, and portal button. Redirect to Stripe checkout URL.

## Database/model changes

Use existing User.subscription fields.

## API routes

| POST | `/api/billing/checkout` | Authenticated | Create checkout |
| POST | `/api/billing/portal` | Authenticated | Customer portal |
| POST | `/api/billing/webhook` | Stripe | Webhooks |

## Controllers/services/middlewares required

billing controller/service, stripe service, planLimit middleware

## Validation rules

plan starter/pro/enterprise; interval monthly/yearly; reject unknown fields.

## Security requirements

Verify Stripe webhook signature. Never trust frontend plan. Do not expose Stripe secrets.

## Error handling requirements

Invalid signature 400; missing customer 400; Stripe API failures return safe 502.

## Test cases to write

1. Checkout works.
2. Invalid plan 400.
3. Unauth blocked.
4. Portal requires customer.
5. Invalid webhook signature 400.
6. Webhook updates subscription.
7. Payment failure stores error.

## Commands to run tests

```bash
npm run test
npm run test:backend
npm run test:frontend
```

## Commands to run the complete app

```bash
npm run dev
```

For production verification where applicable:

```bash
npm run build
npm run start
```

## Expected result after implementation

Users can subscribe and billing status is stored correctly.

## What the user/developer should see after running the app

Billing page redirects to Stripe and shows current plan.

## Regression check instructions to ensure previous features are not broken

All auth/RBAC/user tests must pass.

## Final checklist

- [ ] Previous tests passed before implementation
- [ ] Required files/folders created
- [ ] Required files/folders modified
- [ ] Backend implementation completed
- [ ] Frontend implementation completed where applicable
- [ ] Database/model changes completed where applicable
- [ ] API routes implemented where applicable
- [ ] Controllers/services/middlewares implemented
- [ ] Validation rules implemented exactly
- [ ] Security requirements implemented exactly
- [ ] Error handling implemented exactly
- [ ] New tests added
- [ ] New tests passed
- [ ] Full test suite passed after implementation
- [ ] Backend runs successfully
- [ ] Frontend runs successfully
- [ ] Feature works manually
- [ ] No previous production-ready feature is broken

