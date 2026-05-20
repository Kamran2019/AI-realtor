# 24 — Connect MERN Backend to AI Microservice

## Feature name

MERN backend integration with FastAPI AI microservice.

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

Modify the existing MERN AI detection service so it can use either:

```text
AI_PROVIDER=stub
```

or:

```text
AI_PROVIDER=http
```

When `AI_PROVIDER=http`, the MERN backend must call the separate FastAPI AI microservice.

## Scope of work

Implement HTTP integration from Node/Express backend to the Python AI service.

Do **not** train YOLO in this file.  
Do **not** implement real YOLO inference in this file.  
Do **not** move AI microservice files into MERN backend.

## Correct folder structure

MERN changes must stay here:

```text
project-root/
  backend/
    src/
      services/
        ai/
          defectDetection.service.js
          providers/
            httpDefectDetection.provider.js
            stubDefectDetection.provider.js
      tests/
        ai-defect-http-provider.test.js
```

AI microservice must stay here:

```text
project-root/
  ai-service/
    app/
      main.py
      ...
```

Do not create Node files inside `ai-service/`.  
Do not create Python files inside `backend/src`.

## Files/folders to create

```text
backend/src/services/ai/providers/httpDefectDetection.provider.js
backend/src/tests/ai-defect-http-provider.test.js
```

## Files/folders to modify

```text
backend/src/config/env.js
backend/src/services/ai/defectDetection.service.js
backend/src/controllers/aiInspection.controller.js
backend/.env.example
ai-service/README.md
```

## Backend implementation instructions

### 1. Add env support

Backend env:

```env
AI_PROVIDER=stub
AI_SERVICE_URL=http://localhost:8000
AI_DETECTION_TIMEOUT_MS=30000
```

Allowed providers:

```text
stub
http
```

### 2. Create HTTP provider

Create:

```text
backend/src/services/ai/providers/httpDefectDetection.provider.js
```

Use Axios or existing API utility.

Export:

```js
async function detectDefectsWithHttp({ imageUrl, inspectionId, roomId, imageIndex })
```

It must call:

```text
POST ${AI_SERVICE_URL}/detect
```

Payload:

```json
{
  "imageUrl": "...",
  "inspectionId": "...",
  "roomId": "...",
  "imageIndex": 0
}
```

Timeout:

```text
AI_DETECTION_TIMEOUT_MS
```

### 3. Normalize microservice response

The microservice response:

```json
{
  "success": true,
  "provider": "stub",
  "modelVersion": "defect-microservice-stub-v1",
  "detections": []
}
```

Must become MERN defect objects:

```js
{
  type,
  source: "ai_microservice",
  severity,
  confidence,
  notes,
  imageUrl,
  box,
  modelVersion
}
```

### 4. Update provider router

Modify:

```text
backend/src/services/ai/defectDetection.service.js
```

Behavior:

```text
if AI_PROVIDER === "stub" -> local MERN stub
if AI_PROVIDER === "http" -> FastAPI HTTP provider
else -> config error
```

### 5. Error handling

If AI service is down:

```text
return 502
message: "AI detection service is currently unavailable."
```

If AI service times out:

```text
return 504
message: "AI detection service timed out."
```

If AI service returns invalid schema:

```text
return 502
message: "AI detection service returned an invalid response."
```

Do not save partial defects if HTTP provider fails.

### 6. Keep frontend unchanged

The React frontend still calls MERN:

```text
POST /api/ai/inspections/:inspectionId/rooms/:roomId/images/:imageIndex/detect
```

Frontend should not call FastAPI directly.

## Frontend implementation instructions

No new frontend files are required.

Optional UI improvement:

```text
Show provider/modelVersion after detection so developer can see whether result came from local stub or microservice.
```

If this is added, modify only:

```text
frontend/src/components/inspections/AIDetectionResultPanel.jsx
frontend/src/pages/inspections/InspectionDetailPage.jsx
```

## AI microservice implementation instructions

No new AI microservice functionality is required in this file.

Only update:

```text
ai-service/README.md
```

Add a section explaining that MERN backend connects using:

```env
AI_PROVIDER=http
AI_SERVICE_URL=http://localhost:8000
```

## Database/model changes

No schema changes.

Use existing inspection defect fields:

```text
source
confidence
imageUrl
box
modelVersion
```

## API routes

Existing MERN route remains:

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/ai/inspections/:inspectionId/rooms/:roomId/images/:imageIndex/detect` | Authenticated | Run detection through configured provider |

FastAPI route used internally:

| Method | Route | Purpose |
|---|---|---|
| POST | `${AI_SERVICE_URL}/detect` | Internal AI detection call |

## Controllers/services/middlewares required

```text
backend/src/services/ai/providers/httpDefectDetection.provider.js
backend/src/services/ai/defectDetection.service.js
```

## Validation rules

MERN must validate before calling AI service:

```text
inspectionId valid ObjectId
roomId valid ObjectId
imageIndex integer >= 0
image exists
user has access
```

MERN must validate AI response:

```text
success must be true
modelVersion required string
detections must be array
each detection type allowed enum
each severity low/medium/high
confidence between 0 and 1
box valid if present
```

## Security requirements

```text
- Frontend must never call AI service directly.
- AI_SERVICE_URL must come from env, not user input.
- Do not forward user auth token to AI service.
- Do not expose internal AI service error stack to frontend.
- Do not save detections if response schema is invalid.
- Keep AI service private in production network if possible.
```

## Error handling requirements

```text
- AI service offline -> 502
- AI timeout -> 504
- invalid AI response -> 502
- non-2xx AI response -> 502 with safe message
- provider config error -> 500
```

## Test cases to write

Backend tests with mocked HTTP service:

```text
1. AI_PROVIDER=stub still works
2. AI_PROVIDER=http calls AI_SERVICE_URL/detect
3. HTTP provider sends correct payload
4. HTTP provider normalizes detections
5. HTTP provider saves defects into inspection
6. HTTP timeout returns 504
7. HTTP connection failure returns 502
8. invalid AI response returns 502
9. no partial defects saved on HTTP failure
10. frontend route remains same
```

## Commands to run tests

MERN:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

AI service:

```bash
cd ai-service
pytest
```

## Commands to run complete app

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
cd ai-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend `.env` for microservice mode:

```env
AI_PROVIDER=http
AI_SERVICE_URL=http://localhost:8000
AI_DETECTION_TIMEOUT_MS=30000
```

## Expected result after implementation

The MERN app can run AI detection using either:

```text
local MERN stub
```

or:

```text
FastAPI AI microservice
```

without changing frontend code.

## What the user/developer should see

```text
- Existing Run AI Detection button still works.
- With AI_PROVIDER=stub, detection comes from local MERN stub.
- With AI_PROVIDER=http, detection comes from FastAPI microservice.
- Saved defects include source=ai_microservice when HTTP provider is used.
```

## Regression check instructions

After implementation, run:

```bash
npm run test
npm run test:backend
npm run test:frontend
cd ai-service && pytest
```

Manual checks:

```text
1. Start MERN with AI_PROVIDER=stub and run detection.
2. Start MERN with AI_PROVIDER=http and start AI service.
3. Run detection again.
4. Confirm both modes save defects.
5. Confirm existing inspection/manual defect workflow still works.
6. Confirm property/report/auth flows still work.
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
