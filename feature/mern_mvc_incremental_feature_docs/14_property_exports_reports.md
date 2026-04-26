# 14 — Property Exports and Investor Reports

## Feature name

CSV export and property PDF investor reports.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Generate CSV exports and branded PDF investment summaries for properties.

## Scope of work

Property reports only. Inspection reports later.

## Files/folders to create

```text
backend/src/models/Report.js
backend/src/services/report.service.js
backend/src/services/pdf/propertyReportPdf.service.js
backend/src/services/csvExport.service.js
backend/src/controllers/report.controller.js
backend/src/routes/report.routes.js
backend/src/tests/property-reports.test.js
frontend/src/pages/reports/ReportsPage.jsx
frontend/src/components/properties/PropertyReportActions.jsx
frontend/src/services/reportApi.js
```

## Files/folders to modify

```text
backend/src/routes/index.js
frontend/src/pages/properties/PropertyListPage.jsx
frontend/src/pages/properties/PropertyDetailPage.jsx
frontend/src/routes/AppRoutes.jsx
```

## Backend implementation instructions

Create Report model. Implement filtered CSV export. Implement property PDF generation with branding, property summary, scoring, risk flags, source URL, timestamp. Store using storage abstraction. Enforce monthly report limits.

## Frontend implementation instructions

Add CSV export button, generate PDF button, and reports list page with download links/status.

## Database/model changes

Create Report collection.

## API routes

| GET | `/api/properties/export.csv` | Authenticated | CSV export |
| POST | `/api/reports/property/:propertyId` | Authenticated | Generate PDF |
| GET | `/api/reports` | Authenticated | List reports |
| GET | `/api/reports/:id` | Authenticated | Report detail |

## Controllers/services/middlewares required

report controller/service, PDF service, CSV service, storage service

## Validation rules

propertyId/reportId valid; filters same as property list; report limit checked before generation.

## Security requirements

Users access own reports only; no filesystem path exposure; plan limits enforced.

## Error handling requirements

Not found 404; generation failure marks report failed; zero-row CSV returns headers.

## Test cases to write

1. CSV content-type correct.
2. CSV respects filters.
3. PDF creates report.
4. Report ready with URL/key.
5. Cross-owner blocked.
6. Plan limit enforced.
7. Failed generation status failed.

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

Users can export listings and generate investor PDFs.

## What the user/developer should see after running the app

CSV downloads and reports page lists generated PDFs.

## Regression check instructions to ensure previous features are not broken

Legal pack and prior feature tests pass.

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

