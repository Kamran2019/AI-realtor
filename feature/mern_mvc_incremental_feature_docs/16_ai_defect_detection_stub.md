# 16 — AI Defect Detection Stub

## Feature name

Pluggable AI defect detection interface.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Add AI-ready defect detection service with deterministic stub provider and defect review actions.

## Scope of work

No real ML inference yet. Must be cleanly swappable later.

## Files/folders to create

```text
backend/src/services/ai/defectDetection.service.js
backend/src/services/ai/defectDetectionStub.provider.js
backend/src/controllers/aiInspection.controller.js
backend/src/routes/aiInspection.routes.js
backend/src/tests/ai-defect-detection.test.js
frontend/src/components/inspections/AIDetectButton.jsx
frontend/src/components/inspections/DefectList.jsx
```

## Files/folders to modify

```text
backend/src/models/Inspection.js
backend/src/routes/index.js
frontend/src/pages/inspections/InspectionDetailPage.jsx
frontend/src/services/inspectionApi.js
```

## Backend implementation instructions

Implement `detectDefects({ imageUrl, context })` interface. Stub returns deterministic crack/damp/mould/poor_finish/structural_issue with severity/confidence/boxes. Add detect endpoint per image. Append defects to room and update summary counts. Add update/delete defect endpoints.

## Frontend implementation instructions

Add Run AI Detection button per image. Show defects with type/severity/confidence/notes. Allow severity override, notes, delete false positive.

## Database/model changes

Use nested Inspection.rooms.defects.

## API routes

| POST | `/api/inspections/:id/rooms/:roomId/images/:imageIndex/detect` | Authenticated | Detect |
| PATCH | `/api/inspections/:id/rooms/:roomId/defects/:defectId` | Authenticated | Update defect |
| DELETE | `/api/inspections/:id/rooms/:roomId/defects/:defectId` | Authenticated | Delete defect |

## Controllers/services/middlewares required

AI inspection controller, defect detection service/provider

## Validation rules

imageIndex integer >=0; severity low/medium/high; notes <=3000; allowed defect types.

## Security requirements

Client cannot set confidence/modelVersion for AI output; inspection access required.

## Error handling requirements

Missing image 404; provider failure 502 without modifying defects; invalid defect 404.

## Test cases to write

1. Detection adds defects.
2. Summary updates.
3. Missing image 404.
4. Access blocked.
5. Severity override.
6. Notes update.
7. Delete false positive.
8. Stub deterministic.

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

AI-assisted defects can be generated and reviewed.

## What the user/developer should see after running the app

Defect list appears after clicking AI detection.

## Regression check instructions to ensure previous features are not broken

Inspection upload workflow tests pass.

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

