# 07 — Property Models and Scrape Sources

## Feature name

Property, ScrapeSource, and ScrapeRun models plus source management.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Create property persistence and scraper source configuration APIs.

## Scope of work

Models and source CRUD only. No scraper execution yet.

## Files/folders to create

```text
backend/src/models/Property.js
backend/src/models/ScrapeSource.js
backend/src/models/ScrapeRun.js
backend/src/validators/scrapeSource.validator.js
backend/src/controllers/scrapeSource.controller.js
backend/src/services/scrapeSource.service.js
backend/src/routes/scrape.routes.js
backend/src/tests/scrape-source.test.js
frontend/src/pages/scrape/ScrapeSourcesPage.jsx
frontend/src/services/scrapeApi.js
```

## Files/folders to modify

```text
backend/src/routes/index.js
frontend/src/routes/AppRoutes.jsx
frontend/src/components/Layout.jsx
```

## Backend implementation instructions

Create Property with ownerUserId, source keys, address/postcode/geo, prices, auctionDate, type/tenure, images, description, history, scoring, risks, legalPack. Create ScrapeSource and ScrapeRun. Implement source CRUD and run list.

## Frontend implementation instructions

Create scrape sources page with list, create/edit form, enable/disable toggle, and health fields.

## Database/model changes

Create Property, ScrapeSource, ScrapeRun collections.

## API routes

| GET | `/api/scrape/sources` | admin, sub_admin | List |
| POST | `/api/scrape/sources` | admin, sub_admin | Create |
| PATCH | `/api/scrape/sources/:id` | admin, sub_admin | Update |
| PATCH | `/api/scrape/sources/:id/status` | admin, sub_admin | Toggle |
| GET | `/api/scrape/runs` | admin, sub_admin | Runs |

## Controllers/services/middlewares required

scrape source controller/service/validator

## Validation rules

key lowercase slug 2–50; name 2–100; baseUrl valid URL; cron valid 5-field; timezone required.

## Security requirements

Routes auth protected; admin/sub_admin only; scope by ownerUserId.

## Error handling requirements

Duplicate key 409; invalid ObjectId 400; not found 404.

## Test cases to write

1. Create source.
2. Duplicate key blocked.
3. Invalid URL blocked.
4. User role forbidden.
5. List scoped by owner.
6. Toggle works.

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

Admin/sub_admin can configure scraper sources.

## What the user/developer should see after running the app

Scrape source UI lists and manages sources.

## Regression check instructions to ensure previous features are not broken

Billing and previous auth tests must pass.

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

