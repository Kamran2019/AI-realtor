# 17 — Inspection PDF Reports and Sharing

## Feature name

Branded inspection PDF reports and secure public share links.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Generate inspection PDFs from completed inspections and share them through hashed expiring tokens.

## Scope of work

Inspection reports and sharing only.

## Files/folders to create

```text
backend/src/services/pdf/inspectionReportPdf.service.js
backend/src/services/shareToken.service.js
backend/src/controllers/publicReport.controller.js
backend/src/routes/publicReport.routes.js
backend/src/tests/inspection-reports-sharing.test.js
frontend/src/components/inspections/InspectionReportActions.jsx
frontend/src/pages/public/PublicReportPage.jsx
```

## Files/folders to modify

```text
backend/src/models/Report.js
backend/src/models/Inspection.js
backend/src/controllers/report.controller.js
backend/src/routes/report.routes.js
backend/src/routes/index.js
frontend/src/pages/inspections/InspectionDetailPage.jsx
frontend/src/pages/reports/ReportsPage.jsx
frontend/src/routes/AppRoutes.jsx
```

## Backend implementation instructions

Add generate inspection report endpoint. Only completed inspections. PDF includes branding, inspector, property/client details, rooms, defects/images, severity, confidence, notes, summary, recommendations. Add share enable/disable and public token route using SHA-256 token hash and expiry.

## Frontend implementation instructions

Show Generate Report on completed inspections. Add share/copy/disable on reports. Create public report page.

## Database/model changes

Use Report.share fields and Inspection.report metadata.

## API routes

| POST | `/api/reports/inspection/:inspectionId` | Authenticated | Generate PDF |
| POST | `/api/reports/:id/share` | Authenticated | Enable share |
| DELETE | `/api/reports/:id/share` | Authenticated | Disable share |
| GET | `/api/public/reports/:token` | Public | Public report |

## Controllers/services/middlewares required

inspection PDF service, share token service, public report controller

## Validation rules

inspection/report IDs valid; inspection status completed; expiry future if supplied; token 32-byte random.

## Security requirements

Store only token hash; expired/disabled public links return 404; own reports only.

## Error handling requirements

Incomplete inspection 400; inaccessible 404; PDF failure marks failed; expired share 404.

## Test cases to write

1. Completed inspection report generated.
2. Draft blocked.
3. Report storage set.
4. Share stores hash only.
5. Public token works.
6. Disabled/expired returns 404.
7. Plan limit enforced.

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

Completed inspections produce branded PDFs and secure client links.

## What the user/developer should see after running the app

Generate Report and Copy Share Link actions work.

## Regression check instructions to ensure previous features are not broken

AI detection and inspection workflow tests pass.

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

