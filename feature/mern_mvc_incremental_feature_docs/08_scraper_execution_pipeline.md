# 08 — Scraper Execution Pipeline

## Feature name

Manual and scheduled scraper execution.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Implement adapter-based scraping execution, dedupe/upsert, change history, and scrape run logging.

## Scope of work

Generic scraper execution with three adapters/stubs. No scoring yet.

## Files/folders to create

```text
backend/src/scrapers/index.js
backend/src/scrapers/adapters/sourceOne.adapter.js
backend/src/scrapers/adapters/sourceTwo.adapter.js
backend/src/scrapers/adapters/sourceThree.adapter.js
backend/src/services/scraperRunner.service.js
backend/src/jobs/scrapeScheduler.job.js
backend/src/tests/scraper-runner.test.js
```

## Files/folders to modify

```text
backend/src/controllers/scrapeSource.controller.js
backend/src/routes/scrape.routes.js
backend/src/server.js
```

## Backend implementation instructions

Create adapter interface returning normalized listings. Implement runner that creates ScrapeRun, executes adapter, upserts Property by ownerUserId+sourceKey+sourceListingId, stores changed field history, updates run stats and source health. Add manual run endpoint and scheduler. Prevent concurrent same-source runs.

## Frontend implementation instructions

Add Run Now button and recent run list with stats/status.

## Database/model changes

Use existing Property, ScrapeSource, ScrapeRun.

## API routes

| POST | `/api/scrape/sources/:id/run` | admin, sub_admin | Manual run |
| GET | `/api/scrape/runs` | admin, sub_admin | Run history |

## Controllers/services/middlewares required

scraper runner service, adapters, scheduler job

## Validation rules

sourceId valid; normalized listing requires sourceListingId; URL valid if present; price number/null.

## Security requirements

admin/sub_admin only; scope by owner; sanitize scraped text; prevent duplicate concurrent runs.

## Error handling requirements

Adapter failure marks run failed; listing-level errors increment errors and continue.

## Test cases to write

1. Manual run creates ScrapeRun.
2. New properties created.
3. Re-run dedupes.
4. Changed fields create history.
5. Failure marks run failed.
6. User forbidden.
7. Concurrent run blocked.

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

Scraping sources can run manually/scheduled and create/update properties.

## What the user/developer should see after running the app

Run Now creates scrape runs and properties appear in DB.

## Regression check instructions to ensure previous features are not broken

Scrape source CRUD and all previous tests pass.

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

