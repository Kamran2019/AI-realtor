# 22 — AI Defect Detection Stub Inside MERN

## Feature name

AI defect detection stub in the existing MERN backend/frontend.

## Regression check before making changes

Before touching this feature, run all existing tests from the already-completed MERN/MVC features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

Also manually verify these existing flows still work:

```text
- health check
- signup
- login
- refresh/logout/me
- email verification/reset password
- admin/sub_admin/user RBAC
- user management
- billing page/API
- scrape source CRUD
- scraper run pipeline
- property list/detail
- deal scoring
- bookmarks and notes
- alerts and notifications
- legal pack/risk detection
- property CSV/PDF reports
- admin dashboard/audit logs
```

If any existing test or manual flow fails, stop and fix the regression first. Do not implement the new feature on top of a broken build.


## Objective

Add AI defect detection behavior inside the MERN app using a deterministic stub provider. This gives the full product flow before the real AI microservice is added.

The goal is:

```text
inspection image -> run AI detection -> receive fake/stub detections -> save defects -> user reviews defects
```

## Scope of work

Implement only the MERN-side AI interface and stub provider.

Do **not** create Python FastAPI microservice in this file.  
Do **not** install YOLO in the MERN app.  
Do **not** train models in this file.  
Do **not** put Python files inside `backend/src`.

## Correct folder structure

Use this exact structure:

```text
project-root/
  backend/
    src/
      services/
        ai/
          defectDetection.service.js
          providers/
            stubDefectDetection.provider.js
      controllers/
        aiInspection.controller.js
      routes/
        aiInspection.routes.js
      validators/
        aiInspection.validator.js
      tests/
        ai-defect-stub.test.js

  frontend/
    src/
      components/
        inspections/
          AIDetectButton.jsx
          AIDetectionResultPanel.jsx
      services/
        aiInspectionApi.js
```

Do not create these files under `ai-service/`.  
This file is only for MERN integration and stub logic.

## Files/folders to create

```text
backend/src/services/ai/defectDetection.service.js
backend/src/services/ai/providers/stubDefectDetection.provider.js
backend/src/controllers/aiInspection.controller.js
backend/src/routes/aiInspection.routes.js
backend/src/validators/aiInspection.validator.js
backend/src/tests/ai-defect-stub.test.js
frontend/src/components/inspections/AIDetectButton.jsx
frontend/src/components/inspections/AIDetectionResultPanel.jsx
frontend/src/services/aiInspectionApi.js
```

## Files/folders to modify

```text
backend/src/config/env.js
backend/src/routes/index.js
backend/src/models/Inspection.js
frontend/src/pages/inspections/InspectionDetailPage.jsx
frontend/src/components/inspections/DefectList.jsx
```

## Backend implementation instructions

### 1. Add AI env variables

Add to backend `.env.example`:

```env
AI_PROVIDER=stub
AI_SERVICE_URL=http://localhost:8000
AI_DETECTION_TIMEOUT_MS=30000
```

For this file, only support:

```text
AI_PROVIDER=stub
```

The `AI_SERVICE_URL` is added now for future microservice integration but must not be called yet.

### 2. Create stub provider

Create:

```text
backend/src/services/ai/providers/stubDefectDetection.provider.js
```

Export:

```js
async function detectDefectsWithStub(input) {
  return {
    modelVersion: "defect-stub-v1",
    provider: "stub",
    detections: []
  };
}
```

The stub must be deterministic, not random.

Use a simple deterministic rule:

```text
- If imageUrl contains "crack", return crack.
- If imageUrl contains "damp", return damp.
- If imageUrl contains "mould" or "mold", return mould.
- Otherwise return one low-severity poor_finish detection.
```

Example output:

```json
{
  "modelVersion": "defect-stub-v1",
  "provider": "stub",
  "detections": [
    {
      "type": "crack",
      "severity": "medium",
      "confidence": 0.78,
      "box": { "x": 80, "y": 120, "w": 280, "h": 60 },
      "notes": "Stub detection: possible crack-like defect."
    }
  ]
}
```

### 3. Create detection service

Create:

```text
backend/src/services/ai/defectDetection.service.js
```

Export:

```js
async function runDefectDetection(input)
```

Behavior:

```text
- Read AI_PROVIDER from env.
- If AI_PROVIDER === "stub", call stub provider.
- If unknown provider, throw 500 with message "Unsupported AI provider configured."
- Normalize detections before returning.
```

Normalized defect object must map to `Inspection.rooms[].defects[]`:

```js
{
  type,
  source: "ai_stub",
  severity,
  confidence,
  notes,
  imageUrl,
  box,
  modelVersion
}
```

### 4. Implement AI inspection controller

Create:

```text
backend/src/controllers/aiInspection.controller.js
```

Methods:

```text
runImageDetection
```

Route behavior:

```text
POST /api/ai/inspections/:inspectionId/rooms/:roomId/images/:imageIndex/detect
```

Steps:

```text
1. Validate params.
2. Load inspection.
3. Check user has access using same rules from inspection.service.
4. Locate room.
5. Locate image by imageIndex.
6. Call runDefectDetection.
7. Append returned defects to room.defects.
8. Recalculate inspection summary.
9. Save inspection.
10. Return saved defects and updated summary.
```

### 5. Do not duplicate access logic

If `inspection.service.js` already has access helper methods, reuse them.

If not, create reusable helper:

```text
canAccessInspection(user, inspection)
```

Do not copy/paste inconsistent access rules.

### 6. API routes

Create:

```text
backend/src/routes/aiInspection.routes.js
```

Mount under:

```text
/api/ai/inspections
```

Final route:

```text
POST /api/ai/inspections/:inspectionId/rooms/:roomId/images/:imageIndex/detect
```

## Frontend implementation instructions

### 1. Add AI API service

Create:

```text
frontend/src/services/aiInspectionApi.js
```

Function:

```js
runImageDetection({ inspectionId, roomId, imageIndex })
```

### 2. Add button component

Create:

```text
frontend/src/components/inspections/AIDetectButton.jsx
```

Behavior:

```text
- Shows "Run AI Detection"
- Disabled while loading
- Calls API
- Shows success/error
- Refreshes inspection detail after success
```

### 3. Add result panel

Create:

```text
frontend/src/components/inspections/AIDetectionResultPanel.jsx
```

Display:

```text
- modelVersion
- provider
- number of detections
- confidence
- note: "AI suggestions must be reviewed by a human."
```

### 4. Modify InspectionDetailPage

For every image in every room show:

```text
- image preview
- Run AI Detection button
- defects linked to that image
```

## Database/model changes

Use existing `Inspection.rooms[].defects[]`.

If missing, add these fields to defect subdocument:

```text
source
confidence
imageUrl
box
modelVersion
reviewedByUserId
reviewedAt
```

## API routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/ai/inspections/:inspectionId/rooms/:roomId/images/:imageIndex/detect` | Authenticated | Run stub AI detection on uploaded image |

## Controllers/services/middlewares required

```text
aiInspection.controller.js
aiInspection.routes.js
defectDetection.service.js
stubDefectDetection.provider.js
aiInspection.validator.js
```

## Validation rules

Params:

```text
inspectionId must be valid ObjectId
roomId must be valid ObjectId
imageIndex must be integer >= 0
```

Detection result validation:

```text
type must be allowed defect enum
severity must be low/medium/high
confidence must be number between 0 and 1
box x/y/w/h must be numbers when present
modelVersion required
```

## Security requirements

```text
- Route requires authentication.
- User must have access to inspection.
- Client cannot pass confidence/modelVersion/source.
- Server determines source/modelVersion.
- Do not call external AI service yet.
- Do not store raw provider errors in user-facing response.
```

## Error handling requirements

```text
- Invalid params return 400.
- Inspection not found returns 404.
- Room not found returns 404.
- Image index not found returns 404.
- Unsupported AI_PROVIDER returns 500.
- Provider failure returns 502 and does not save partial defects.
```

## Test cases to write

```text
1. detection route requires auth
2. invalid inspectionId returns 400
3. missing inspection returns 404
4. missing room returns 404
5. invalid image index returns 404
6. user cannot detect on inaccessible inspection
7. stub returns crack when image URL contains crack
8. stub returns damp when image URL contains damp
9. stub returns mould when image URL contains mould/mold
10. default stub returns poor_finish
11. returned defects are saved to inspection
12. summary counts update after detection
13. confidence/modelVersion/source are server-controlled
14. unsupported AI_PROVIDER fails safely
```

## Commands to run tests

```bash
npm run test
npm run test:backend
npm run test:frontend
```

## Commands to run complete app

```bash
npm run dev
```

## Expected result after implementation

The MERN app has a complete AI-ready detection flow using deterministic stub detections. The frontend can run detection on an inspection image and display saved defects.

## What the user/developer should see

```text
- Inspection detail page has "Run AI Detection" beside each image.
- Clicking the button adds AI-stub defects.
- Defects show type, severity, confidence, source, and model version.
- User can still manually edit/delete defects.
```

## Regression check instructions

After implementation:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

Manual checks:

```text
- inspection create/upload still works
- manual defects still work
- AI stub defects can be added
- existing property/report/auth features still work
```

## Final checklist

- [ ] Previous tests passed before implementation
- [ ] Correct folders used exactly as defined in this file
- [ ] No files created in the wrong app/folder
- [ ] Required backend files created/modified
- [ ] Required frontend files created/modified
- [ ] Required AI service files created/modified where applicable
- [ ] Database/model changes completed where applicable
- [ ] API routes implemented and mounted
- [ ] Controllers/services/middlewares implemented
- [ ] Validation rules implemented exactly
- [ ] Security requirements implemented exactly
- [ ] Error handling implemented exactly
- [ ] New backend tests added
- [ ] New frontend tests added where applicable
- [ ] AI service tests added where applicable
- [ ] New tests passed
- [ ] Full existing test suite passed after implementation
- [ ] Backend runs successfully
- [ ] Frontend runs successfully
- [ ] AI microservice runs successfully where applicable
- [ ] Feature works manually
- [ ] No previous production-ready feature is broken
