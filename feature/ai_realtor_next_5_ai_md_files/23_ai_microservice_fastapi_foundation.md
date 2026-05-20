# 23 — AI Microservice Foundation with FastAPI

## Feature name

Separate Python FastAPI microservice foundation for AI defect detection.

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

Create a separate AI microservice folder for future YOLO-based property defect detection. This microservice must be independent from the MERN backend but callable by it later.

## Scope of work

Create the Python microservice foundation only:

```text
- FastAPI app
- health endpoint
- detect endpoint with stub provider
- request/response schemas
- Dockerfile
- tests
```

Do **not** install YOLO model inference yet.  
Do **not** modify MERN detection to call this service yet.  
Do **not** place Python files under `backend/src`.

## Correct folder structure

Use this exact folder structure:

```text
project-root/
  ai-service/
    app/
      main.py
      core/
        config.py
        logging.py
      schemas/
        detection.py
      services/
        detection_service.py
      providers/
        stub_provider.py
      tests/
        test_health.py
        test_detect_stub.py
    requirements.txt
    requirements-dev.txt
    Dockerfile
    .env.example
    README.md
```

Important:

```text
- All Python AI files must go under ai-service/
- Do not put Python files inside backend/
- Do not put React files inside ai-service/
- Do not modify frontend in this phase
```

## Files/folders to create

```text
ai-service/app/main.py
ai-service/app/core/config.py
ai-service/app/core/logging.py
ai-service/app/schemas/detection.py
ai-service/app/services/detection_service.py
ai-service/app/providers/stub_provider.py
ai-service/app/tests/test_health.py
ai-service/app/tests/test_detect_stub.py
ai-service/requirements.txt
ai-service/requirements-dev.txt
ai-service/Dockerfile
ai-service/.env.example
ai-service/README.md
```

## Files/folders to modify

```text
project-root/package.json
docker-compose.yml if it already exists
```

Only add scripts/config to run the AI service. Do not change MERN route logic yet.

## AI service implementation instructions

### 1. Create FastAPI app

`ai-service/app/main.py`:

```text
- Create FastAPI app named "AI Realtor Defect Detection Service"
- Add GET /health
- Add POST /detect
```

Health response:

```json
{
  "success": true,
  "service": "ai-defect-detection-service",
  "provider": "stub",
  "modelVersion": "defect-microservice-stub-v1"
}
```

### 2. Create config

`ai-service/app/core/config.py`

Read env variables:

```env
AI_SERVICE_ENV=development
AI_PROVIDER=stub
MODEL_PATH=./models/defect-yolo.pt
MAX_IMAGE_MB=10
REQUEST_TIMEOUT_SECONDS=30
```

For this phase, support only:

```text
AI_PROVIDER=stub
```

### 3. Create detection schemas

`ai-service/app/schemas/detection.py`

Request schema:

```python
class DetectionRequest(BaseModel):
    imageUrl: str
    inspectionId: str | None = None
    roomId: str | None = None
    imageIndex: int | None = None
```

Response schema:

```python
class DetectionResponse(BaseModel):
    success: bool
    provider: str
    modelVersion: str
    detections: list[Detection]
```

Detection schema:

```python
class Detection(BaseModel):
    type: str
    severity: str
    confidence: float
    box: Box | None = None
    notes: str | None = None
```

Box schema:

```python
class Box(BaseModel):
    x: float
    y: float
    w: float
    h: float
```

### 4. Stub provider

Create deterministic stub provider:

```text
- imageUrl containing crack -> crack medium 0.78
- imageUrl containing damp -> damp medium 0.74
- imageUrl containing mould or mold -> mould high 0.81
- otherwise poor_finish low 0.55
```

### 5. Detect endpoint

`POST /detect`

Input:

```json
{
  "imageUrl": "http://localhost:5001/uploads/inspections/crack-wall.jpg",
  "inspectionId": "optional",
  "roomId": "optional",
  "imageIndex": 0
}
```

Output:

```json
{
  "success": true,
  "provider": "stub",
  "modelVersion": "defect-microservice-stub-v1",
  "detections": [
    {
      "type": "crack",
      "severity": "medium",
      "confidence": 0.78,
      "box": { "x": 80, "y": 120, "w": 280, "h": 60 },
      "notes": "Microservice stub detection: possible crack-like defect."
    }
  ]
}
```

### 6. Logging

Create simple logger. Every request should log:

```text
endpoint
provider
modelVersion
durationMs
```

Do not log sensitive tokens or full private URLs with secrets.

## MERN changes allowed in this phase

Only add root scripts if useful:

```json
{
  "scripts": {
    "dev:ai": "cd ai-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
  }
}
```

Do not change backend detection provider yet.

## Database/model changes

None.

## API routes in AI service

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Verify AI service |
| POST | `/detect` | Return stub detections |

## Controllers/services/middlewares required

In AI service:

```text
main.py route handlers
detection_service.py
stub_provider.py
config.py
logging.py
```

## Validation rules

```text
imageUrl required
imageUrl must be valid URL
imageIndex optional but if present must be >= 0
inspectionId optional string
roomId optional string
confidence returned must be 0–1
severity returned must be low/medium/high
type returned must be allowed defect type
```

## Security requirements

```text
- No secret keys in code.
- Do not execute user input.
- Do not write remote images to disk in this phase.
- Do not allow arbitrary shell commands.
- Do not expose stack traces in production mode.
```

## Error handling requirements

```text
- Invalid request returns 422 from Pydantic.
- Unsupported provider returns 500 with safe message.
- Provider exception returns 502 with safe message.
- /health must not depend on model file existing in this stub phase.
```

## Test cases to write

Use pytest.

```text
1. GET /health returns 200
2. health response includes provider stub
3. POST /detect with crack URL returns crack
4. POST /detect with damp URL returns damp
5. POST /detect with mould URL returns mould
6. POST /detect with generic URL returns poor_finish
7. invalid imageUrl returns 422
8. imageIndex < 0 returns 422
9. response confidence is between 0 and 1
10. response modelVersion is defect-microservice-stub-v1
```

## Commands to run AI service tests

```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

For Windows PowerShell:

```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

## Commands to run AI microservice

```bash
cd ai-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
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

## Expected result after implementation

A standalone AI microservice runs at:

```text
http://localhost:8000
```

Health endpoint:

```text
GET http://localhost:8000/health
```

Detection endpoint:

```text
POST http://localhost:8000/detect
```

The microservice returns stub detections but is structured for real YOLO inference later.

## What the user/developer should see

```text
- AI service starts successfully
- /health returns service info
- /detect returns deterministic stub detections
- MERN app still works exactly as before
```

## Regression check instructions

After creating the AI service:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

Then:

```bash
cd ai-service
pytest
```

Manual checks:

```text
- MERN app still runs
- AI service runs separately
- AI service /health works
- AI service /detect works
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
