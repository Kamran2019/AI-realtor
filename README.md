# AI Auction Property Analyzer + AI Snagging & Inspection Tool

Production-oriented MERN SaaS workspace for:

- auction deal discovery and scoring
- scraper-driven property ingestion
- alerts and notifications
- branded PDF reporting
- mobile-first snagging and inspection workflows
- Stripe subscription billing with feature gating

## Tech stack

- MongoDB + Mongoose
- Express + Node.js
- React + React Router + Redux Toolkit
- Tailwind CSS
- Stripe Billing + Checkout + Customer Portal
- Nodemailer
- Cheerio + node-cron
- PDFKit

## Roles and account model

- `admin`: account owner
- `sub_admin`: delegated manager within the same account
- `user`: standard account user

There is no team/organization object. The account owner is the `admin`, and all `sub_admin` and `user` accounts are scoped under that admin through `ownerUserId`.

## Workspace structure

```text
.
|-- backend
|   |-- src
|   |   |-- config
|   |   |-- controllers
|   |   |-- jobs
|   |   |-- middleware
|   |   |-- models
|   |   |-- routes
|   |   |-- scripts
|   |   |-- services
|   |   `-- utils
|   |-- uploads
|   |-- .env.example
|   `-- package.json
|-- frontend
|   |-- src
|   |   |-- api
|   |   |-- app
|   |   |-- components
|   |   |-- features
|   |   |-- layouts
|   |   `-- pages
|   |-- .env.example
|   `-- package.json
|-- docker-compose.yml
|-- package.json
`-- README.md
```

## Key backend modules

- Auth: email/password, Google OAuth, verify email, forgot/reset password, refresh token rotation
- Billing: Stripe Checkout Sessions, Customer Portal, webhooks, plan-gated limits
- Properties: list/filter/detail, bookmarks, notes, CSV export, PDF investment summary
- Scraping: three configurable source adapters, cron scheduling, scrape runs, history tracking
- Alerts: rule matching on property updates plus daily evaluation
- Inspections: room capture, image upload, AI defect stub, PDF reporting, public share links
- Admin: user management, scraper health, audit logs, dashboard summary

## Available plans

- `free`
- `starter`
- `pro`
- `enterprise`

Plan feature limits live in `backend/src/config/plans.js`.

## Environment setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Update MongoDB, JWT, Stripe, SMTP, and Google OAuth values.

### Google OAuth redirect

Use this callback URL in Google Cloud:

```text
http://localhost:5000/api/auth/google/callback
```

### Stripe setup

The billing integration uses Stripe Billing APIs with Checkout Sessions and Customer Portal, using the latest API version configured in code (`2026-02-25.clover`).

Required env values:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- plan price IDs for starter/pro/enterprise monthly and yearly

## Local development

### Option 1: native npm

1. Start MongoDB locally.
2. Run:

```bash
npm install
npm run migrate
npm run seed:admin
npm run dev
```

This starts:

- backend on `http://localhost:5000`
- frontend on `http://localhost:5173`

### Windows one-click dev scripts

If you want the project to bring up its local Mongo helper, then the backend, then the frontend in order, use:

```bat
start-dev.cmd
```

To stop the managed dev stack later:

```bat
stop-dev.cmd
```

### Option 2: Docker Compose

```bash
docker compose up --build
```

## Seeded admin

The admin seed script reads:

- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`
- `ADMIN_SEED_NAME`

Run:

```bash
npm run seed:admin
```

It also bootstraps the three default scrape sources in a disabled state.

## Migration/index sync

```bash
npm run migrate
```

This runs `syncIndexes()` on the core Mongoose models.

## Stripe webhook testing

1. Install the Stripe CLI.
2. Authenticate:

```bash
stripe login
```

3. Forward events to the backend:

```bash
stripe listen --forward-to http://localhost:5000/api/billing/webhooks
```

4. Copy the returned signing secret into `STRIPE_WEBHOOK_SECRET`.

Useful test events:

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

## Scraping notes

- Three adapters are included: `source_one`, `source_two`, `source_three`.
- Default sources are created automatically for new admin accounts and the seed admin.
- They are intentionally disabled until you configure real target URLs and selectors.
- HTML parsing uses Cheerio. A Puppeteer fallback flag is reserved for future JS-heavy sources.

## API surface

Implemented route groups:

- `/api/auth`
- `/api/users`
- `/api/billing`
- `/api/properties`
- `/api/bookmarks`
- `/api/notes`
- `/api/alerts`
- `/api/notifications`
- `/api/inspections`
- `/api/reports`
- `/api/scrape`
- `/api/audit`
- `/api/dashboard`

## Core scripts

At the repo root:

```bash
npm run dev
npm run migrate
npm run seed:admin
```

Backend workspace:

```bash
npm run dev -w backend
npm run migrate -w backend
npm run seed:admin -w backend
```

Frontend workspace:

```bash
npm run dev -w frontend
npm run build -w frontend
```

## Important implementation notes

- Refresh tokens are stored in `httpOnly` cookies and rotated server-side.
- Access tokens are attached as bearer tokens from the React app.
- Account-level billing and feature gating are resolved from the owner admin record.
- Company branding is stored on the `User` document and used in generated PDFs.
- Report sharing uses hashed tokens with expiry.
- Local uploads are written to `backend/uploads`; the storage abstraction is ready for S3-compatible replacement.

## Verification performed

- Backend JavaScript syntax check passed with `node --check` across `backend/src`.

Frontend dependency installation and production build were not executed in this environment because workspace dependencies have not been installed yet.
