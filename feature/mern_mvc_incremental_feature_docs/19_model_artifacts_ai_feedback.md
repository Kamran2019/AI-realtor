# 19 — Model Artifacts and AI Feedback

## Feature name

AI model version tracking and feedback capture.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Track AI model artifacts and collect user corrections for future retraining.

## Scope of work

No retraining pipeline yet.

## Files/folders to create

```text
backend/src/models/ModelArtifact.js
backend/src/models/AIFeedback.js
backend/src/validators/modelArtifact.validator.js
backend/src/validators/aiFeedback.validator.js
backend/src/controllers/modelArtifact.controller.js
backend/src/controllers/aiFeedback.controller.js
backend/src/services/modelArtifact.service.js
backend/src/services/aiFeedback.service.js
backend/src/routes/modelArtifact.routes.js
backend/src/routes/aiFeedback.routes.js
backend/src/tests/model-feedback.test.js
frontend/src/pages/admin/ModelArtifactsPage.jsx
frontend/src/components/ai/AIFeedbackButton.jsx
frontend/src/services/modelArtifactApi.js
frontend/src/services/aiFeedbackApi.js
```

## Files/folders to modify

```text
backend/src/routes/index.js
frontend/src/pages/properties/PropertyDetailPage.jsx
frontend/src/pages/inspections/InspectionDetailPage.jsx
frontend/src/routes/AppRoutes.jsx
```

## Backend implementation instructions

Create ModelArtifact and AIFeedback models. Add model artifact list/create/update. Add AI feedback creation for deal_scoring and defect_detection. Admin/sub_admin can list feedback.

## Frontend implementation instructions

Add model artifacts page. Add feedback modal buttons on property scoring and inspection defects.

## Database/model changes

Create ModelArtifact and AIFeedback collections.

## API routes

| GET/POST/PATCH | `/api/model-artifacts` | admin/sub_admin/admin | Model management |
| POST | `/api/ai-feedback` | Authenticated | Submit feedback |
| GET | `/api/ai-feedback` | admin, sub_admin | List feedback |

## Controllers/services/middlewares required

model artifact controller/service, AI feedback controller/service

## Validation rules

type deal_scoring/defect_detection; version 1–50; metrics valid; feedback target required; payload objects required.

## Security requirements

Only admin creates/updates models; users submit feedback only for accessible targets; sanitize text.

## Error handling requirements

Duplicate model 409; invalid target 404; forbidden 403.

## Test cases to write

1. Admin creates artifact.
2. Duplicate version rejected.
3. User cannot create artifact.
4. Submit property feedback.
5. Submit inspection feedback.
6. Cross-owner target blocked.
7. Admin lists feedback.
8. Metrics validation.

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

AI outputs become traceable and correctable.

## What the user/developer should see after running the app

Admin sees model versions; users can report AI corrections.

## Regression check instructions to ensure previous features are not broken

Admin dashboard and all previous tests pass.

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

