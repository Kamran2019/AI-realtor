# 10 — Deal Scoring Engine

## Feature name

Rules-based property deal scoring v1.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Calculate score, ARV, rent, yield, ROI, confidence, and category for properties.

## Scope of work

Deterministic rules engine only. No ML model training.

## Files/folders to create

```text
backend/src/services/dealScoring.service.js
backend/src/controllers/scoring.controller.js
backend/src/routes/scoring.routes.js
backend/src/tests/deal-scoring.test.js
frontend/src/components/properties/DealScoreBadge.jsx
```

## Files/folders to modify

```text
backend/src/services/scraperRunner.service.js
backend/src/routes/index.js
frontend/src/pages/properties/PropertyListPage.jsx
frontend/src/pages/properties/PropertyDetailPage.jsx
```

## Backend implementation instructions

Implement calculatePropertyScore. Use guide price, bedrooms, floor area, tenure, auctionDate, risk flags. ARV = guidePrice*1.15. Rent assumptions by bedrooms. Calculate yield/ROI/confidence/category. Auto-score after scraper upsert. Add recalculate endpoint for admin/sub_admin.

## Frontend implementation instructions

Show score badges in list and full score breakdown in detail. Add recalculate button for admin/sub_admin.

## Database/model changes

Use Property.scoring.

## API routes

| POST | `/api/scoring/properties/:id/recalculate` | admin, sub_admin | Recalculate score |

## Controllers/services/middlewares required

dealScoring service, scoring controller/routes

## Validation rules

Property ID valid; missing guide price produces unknown/null score; score clamped 0–100.

## Security requirements

Client cannot submit score values. Recalculate is server-side only.

## Error handling requirements

Missing property 404; invalid ID 400; calculation errors do not corrupt existing scoring.

## Test cases to write

1. Missing guide price returns unknown.
2. ARV/rent/yield/ROI computed.
3. Score clamped.
4. Confidence changes with completeness.
5. Red flags reduce score.
6. Admin recalc works.
7. User forbidden.
8. Scraper auto-scores.

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

Properties display useful investment scoring.

## What the user/developer should see after running the app

Property cards show deal score; detail shows score breakdown.

## Regression check instructions to ensure previous features are not broken

Property dashboard and scraper tests pass.

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

