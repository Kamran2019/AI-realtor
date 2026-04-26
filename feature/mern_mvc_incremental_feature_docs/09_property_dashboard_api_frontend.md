# 09 — Property Dashboard

## Feature name

Property list/detail, filters, sorting, and limited edits.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Implement property APIs and dashboard pages for browsing auction listings.

## Scope of work

Read/update dashboard features only. No bookmarks, alerts, or reports.

## Files/folders to create

```text
backend/src/validators/property.validator.js
backend/src/controllers/property.controller.js
backend/src/services/property.service.js
backend/src/routes/property.routes.js
backend/src/tests/property-dashboard.test.js
frontend/src/pages/properties/PropertyListPage.jsx
frontend/src/pages/properties/PropertyDetailPage.jsx
frontend/src/components/properties/PropertyFilters.jsx
frontend/src/components/properties/PropertyCard.jsx
frontend/src/services/propertyApi.js
```

## Files/folders to modify

```text
backend/src/routes/index.js
frontend/src/routes/AppRoutes.jsx
frontend/src/components/Layout.jsx
```

## Backend implementation instructions

Implement GET list with search, postcode, status, min/max price, score, yield, type, tenure, auction date, pagination, sorting. Implement detail and limited PATCH status/tags/description for admin/sub_admin.

## Frontend implementation instructions

Create `/properties` list with filters/sorting/pagination and `/properties/:id` detail. Show edit controls only for admin/sub_admin.

## Database/model changes

Use existing Property model.

## API routes

| GET | `/api/properties` | Authenticated | List/filter |
| GET | `/api/properties/:id` | Authenticated | Detail |
| PATCH | `/api/properties/:id` | admin, sub_admin | Limited edit |

## Controllers/services/middlewares required

property controller/service/validator

## Validation rules

page >=1; limit 1–100; numeric ranges valid; score 0–100; allowed sort fields only; patch allowed fields only.

## Security requirements

Auth required; scope by ownerUserId; prevent Mongo operator injection; only admin/sub_admin patch.

## Error handling requirements

Invalid query 400; invalid ID 400; not found 404; forbidden 403.

## Test cases to write

1. List own properties.
2. Search/filter/sort work.
3. Pagination metadata.
4. Detail works.
5. Cross-owner hidden.
6. User cannot patch.
7. Admin patch works.
8. Disallowed patch rejected.

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

Users can browse auction listings through dashboard.

## What the user/developer should see after running the app

`/properties` shows listing cards and detail pages.

## Regression check instructions to ensure previous features are not broken

Scraper pipeline and previous tests pass.

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

