# 13 — Legal Pack Parsing and Risk Detection

## Feature name

PDF legal pack parsing and red flag detection.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Attach legal pack PDFs/URLs to properties and detect initial red flags through deterministic text rules.

## Scope of work

Legal pack parsing and risk flags only. No advanced legal AI.

## Files/folders to create

```text
backend/src/services/legalPack.service.js
backend/src/services/riskDetection.service.js
backend/src/controllers/legalPack.controller.js
backend/src/routes/legalPack.routes.js
backend/src/tests/legal-pack-risk.test.js
frontend/src/components/properties/LegalPackPanel.jsx
frontend/src/services/legalPackApi.js
```

## Files/folders to modify

```text
backend/src/models/Property.js
backend/src/routes/index.js
frontend/src/pages/properties/PropertyDetailPage.jsx
```

## Backend implementation instructions

Implement PDF upload/URL attach endpoint. Validate PDF <=20MB. Extract text with pdf-parse. Store PDF URL/key/checksum and parsed timestamp. Detect short lease (<80), subsidence, structural movement, damp, flood risk, planning restriction, non-standard construction. Recalculate score after risks update.

## Frontend implementation instructions

Add legal pack panel on property detail with upload/paste URL for admin/sub_admin and visible red flag badges.

## Database/model changes

Use Property.legalPack and Property.risks.

## API routes

| POST | `/api/properties/:id/legal-pack` | admin, sub_admin | Upload/parse |
| GET | `/api/properties/:id/legal-pack/risks` | Authenticated | View risks |

## Controllers/services/middlewares required

legalPack service, riskDetection service, upload middleware

## Validation rules

Property ID valid; file PDF only <=20MB; URL HTTPS valid; require file or URL.

## Security requirements

Only admin/sub_admin upload; all authenticated viewers can see risk summary; sanitize extracted text.

## Error handling requirements

Invalid file 400; parse failure 422; property not found 404; storage failure 500.

## Test cases to write

1. Admin uploads PDF.
2. User forbidden upload.
3. Invalid type rejected.
4. Oversized rejected.
5. Text parsed.
6. Risk phrases detected.
7. Score recalculated.
8. Risks visible.

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

Legal pack red flags appear on property details.

## What the user/developer should see after running the app

Upload legal pack, then see risk badges.

## Regression check instructions to ensure previous features are not broken

Alerts, scoring, property dashboard tests pass.

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

