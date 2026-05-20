# 25 — YOLO Defect Detection Model Training and Real Inference

## Feature name

Free/open-source YOLO model training and real AI microservice inference.

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

Upgrade the AI microservice from deterministic stub detection to real YOLO-based defect detection using free/open-source tooling and datasets.

Recommended starting model:

```text
YOLO11n or YOLOv8n
```

Prefer:

```text
YOLO11n
```

because it is lightweight and suitable for MVP inference.

## Scope of work

Implement AI microservice support for YOLO inference and create training structure.

This file covers:

```text
- dataset folder structure
- YOLO training config
- training script
- inference provider
- mapping YOLO classes to app defect enums
- FastAPI /detect using YOLO provider
- tests with mocked model
```

Do **not** put YOLO or Python ML code inside MERN backend.  
Do **not** make React call YOLO directly.  
Do **not** hardcode local absolute file paths.

## Correct folder structure

Use this exact structure:

```text
project-root/
  ai-service/
    app/
      main.py
      core/
        config.py
      schemas/
        detection.py
      services/
        detection_service.py
      providers/
        stub_provider.py
        yolo_provider.py
      utils/
        image_loader.py
        severity_mapper.py
        class_mapper.py
      models/
        .gitkeep
        defect-yolo.pt
      training/
        README.md
        data.yaml
        train_yolo.py
        evaluate_yolo.py
        export_model.py
        datasets/
          README.md
          defects/
            images/
              train/
              val/
              test/
            labels/
              train/
              val/
              test/
      tests/
        test_yolo_provider_mocked.py
        test_detect_yolo_mocked.py
    requirements.txt
    requirements-dev.txt
    .env.example
```

Important:

```text
- YOLO model files go in ai-service/app/models/
- Training scripts go in ai-service/app/training/
- Datasets go in ai-service/app/training/datasets/
- MERN app must not store model files
- MERN app must only call ai-service through HTTP
```

## Files/folders to create

```text
ai-service/app/providers/yolo_provider.py
ai-service/app/utils/image_loader.py
ai-service/app/utils/severity_mapper.py
ai-service/app/utils/class_mapper.py
ai-service/app/models/.gitkeep
ai-service/app/training/README.md
ai-service/app/training/data.yaml
ai-service/app/training/train_yolo.py
ai-service/app/training/evaluate_yolo.py
ai-service/app/training/export_model.py
ai-service/app/training/datasets/README.md
ai-service/app/tests/test_yolo_provider_mocked.py
ai-service/app/tests/test_detect_yolo_mocked.py
```

## Files/folders to modify

```text
ai-service/app/core/config.py
ai-service/app/services/detection_service.py
ai-service/app/main.py
ai-service/app/schemas/detection.py
ai-service/requirements.txt
ai-service/.env.example
ai-service/README.md
```

## Recommended free model options

### Option 1 — Recommended MVP

```text
YOLO11n detection
```

Use for:

```text
crack
damp
mould
peeling_paint
water_seepage
stain
wall_hole
tile_damage
poor_finish
```

### Option 2 — Stable fallback

```text
YOLOv8n detection
```

Use if YOLO11 setup causes dependency issues.

### Option 3 — Later upgrade

```text
YOLO11-seg
```

Use later when you need exact defect masks instead of boxes.

## Important license warning

Before commercial release, verify the license of:

```text
- Ultralytics package/model
- datasets used for training
- any pretrained weights
```

If using AGPL tooling in a closed-source SaaS, confirm legal compatibility or use a commercial license / alternative open model.

## Dataset instructions

Use YOLO format:

```text
dataset/
  images/
    train/
    val/
    test/
  labels/
    train/
    val/
    test/
  data.yaml
```

Classes for MVP:

```yaml
names:
  0: crack
  1: damp
  2: mould
  3: peeling_paint
  4: water_seepage
  5: stain
  6: wall_hole
  7: tile_damage
  8: poor_finish
```

Each label file format:

```text
class_id x_center y_center width height
```

All coordinates are normalized 0–1.

## Training implementation instructions

### 1. Update requirements

Add to `ai-service/requirements.txt`:

```text
ultralytics
opencv-python
pillow
numpy
requests
```

### 2. Create training script

`ai-service/app/training/train_yolo.py`

Must support:

```bash
python app/training/train_yolo.py --model yolo11n.pt --data app/training/data.yaml --epochs 50 --imgsz 640 --batch 16
```

Behavior:

```text
- Validate data.yaml exists.
- Start YOLO training.
- Save best model path output.
- Print metrics path.
```

### 3. Create evaluate script

`evaluate_yolo.py`

Must support:

```bash
python app/training/evaluate_yolo.py --model app/models/defect-yolo.pt --data app/training/data.yaml
```

Print:

```text
precision
recall
mAP50
mAP50-95
```

### 4. Create export script

`export_model.py`

Must support:

```bash
python app/training/export_model.py --model runs/detect/train/weights/best.pt --output app/models/defect-yolo.pt
```

It should copy or export the trained model to:

```text
ai-service/app/models/defect-yolo.pt
```

## YOLO inference implementation instructions

### 1. Update config

Add env vars:

```env
AI_PROVIDER=yolo
MODEL_PATH=app/models/defect-yolo.pt
YOLO_CONFIDENCE_THRESHOLD=0.35
YOLO_IOU_THRESHOLD=0.5
```

Allowed providers now:

```text
stub
yolo
```

### 2. Create image loader

`image_loader.py`

Must support:

```text
- HTTP/HTTPS image URL
- local dev URL from MERN uploads if accessible
```

Requirements:

```text
- max image size 10MB
- timeout 15 seconds
- validate content type image/jpeg, image/png, image/webp
- load into PIL/OpenCV format
```

### 3. Create class mapper

Map model class names to app defect enum:

```python
CLASS_TO_DEFECT = {
    "crack": "crack",
    "damp": "damp",
    "mould": "mould",
    "mold": "mould",
    "peeling_paint": "peeling_paint",
    "water_seepage": "water_seepage",
    "stain": "stain",
    "wall_hole": "wall_hole",
    "tile_damage": "tile_damage",
    "poor_finish": "poor_finish"
}
```

Unknown classes:

```text
skip by default
```

Do not return unknown classes to MERN.

### 4. Create severity mapper

Initial severity rules:

```text
confidence >= 0.80 and box area >= 15% image area -> high
confidence >= 0.65 -> medium
otherwise -> low
```

For special cases:

```text
structural crack/high confidence crack may become high
mould high confidence may become high
damp high confidence + large area may become high
```

Keep this deterministic.

### 5. Create YOLO provider

`yolo_provider.py`

Export:

```python
class YoloDefectProvider:
    def detect(self, request: DetectionRequest) -> DetectionResponse:
        ...
```

Behavior:

```text
- lazy-load model once
- load image using image_loader
- run YOLO inference
- filter by confidence threshold
- convert boxes to x/y/w/h pixel format
- map class names to defect enums
- map severity
- return DetectionResponse
```

Model version:

```text
yolo-defect-v1
```

### 6. Update detection service

`detection_service.py`

Behavior:

```text
if AI_PROVIDER == "stub": call stub
if AI_PROVIDER == "yolo": call YOLO provider
else: safe config error
```

## MERN changes

No MERN code changes are required if file 24 is already complete.

MERN backend should use:

```env
AI_PROVIDER=http
AI_SERVICE_URL=http://localhost:8000
```

AI service should use:

```env
AI_PROVIDER=yolo
MODEL_PATH=app/models/defect-yolo.pt
```

Flow:

```text
React -> MERN backend -> FastAPI ai-service -> YOLO model -> FastAPI response -> MERN saves defects
```

## Database/model changes

No MongoDB schema changes.

Use existing Inspection defect fields:

```text
type
source=ai_microservice
severity
confidence
imageUrl
box
modelVersion=yolo-defect-v1
```

## API routes in AI service

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Show provider and model status |
| POST | `/detect` | Run YOLO detection |

## Controllers/services/middlewares required

```text
ai-service/app/providers/yolo_provider.py
ai-service/app/utils/image_loader.py
ai-service/app/utils/severity_mapper.py
ai-service/app/utils/class_mapper.py
ai-service/app/services/detection_service.py
```

## Validation rules

```text
imageUrl required valid URL
image content type must be jpg/png/webp
image size max 10MB
confidence threshold 0–1
YOLO output class must map to allowed defect enum
box values must be non-negative
severity must be low/medium/high
```

## Security requirements

```text
- Do not execute user-supplied paths.
- MODEL_PATH comes only from env.
- Prevent SSRF as much as possible:
  - In production, prefer signed internal image URLs or object storage URLs.
  - Do not allow arbitrary private network URLs unless explicitly configured.
- Limit image size.
- Set HTTP timeouts.
- Do not expose model stack trace in API response.
- Keep AI service internal/private in production.
```

## Error handling requirements

```text
- Missing model file returns 503 "AI model is not available."
- Invalid image URL returns 422.
- Image download timeout returns 504.
- Unsupported image type returns 415.
- YOLO inference error returns 502.
- Empty detections returns success true with detections []
```

## Test cases to write

Use mocked YOLO model for unit tests.

```text
1. health works with yolo provider when model mocked
2. yolo provider maps crack class to crack defect
3. yolo provider maps mold to mould
4. unknown class is skipped
5. low confidence detection is filtered out
6. box converts to x/y/w/h
7. severity high for high confidence large area
8. severity medium for medium confidence
9. empty model output returns empty detections
10. missing model file returns 503
11. invalid image URL rejected
12. unsupported image MIME rejected
13. detection response matches schema
```

## Commands to install AI service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
```

Windows PowerShell:

```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt -r requirements-dev.txt
```

## Commands to train model

```bash
cd ai-service
python app/training/train_yolo.py --model yolo11n.pt --data app/training/data.yaml --epochs 50 --imgsz 640 --batch 16
```

## Commands to export model

```bash
cd ai-service
python app/training/export_model.py --model runs/detect/train/weights/best.pt --output app/models/defect-yolo.pt
```

## Commands to evaluate model

```bash
cd ai-service
python app/training/evaluate_yolo.py --model app/models/defect-yolo.pt --data app/training/data.yaml
```

## Commands to run AI service with YOLO

```bash
cd ai-service
AI_PROVIDER=yolo MODEL_PATH=app/models/defect-yolo.pt uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Commands to run complete app

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
cd ai-service
AI_PROVIDER=yolo MODEL_PATH=app/models/defect-yolo.pt uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend `.env`:

```env
AI_PROVIDER=http
AI_SERVICE_URL=http://localhost:8000
```

## Expected result after implementation

The app can run real YOLO-based defect detection through a separate AI microservice. Detected defects are saved into the existing inspection workflow and can be reviewed/edited by users.

## What the user/developer should see

```text
- AI service /health says provider=yolo
- MERN Run AI Detection button still calls MERN backend
- MERN backend calls FastAPI
- FastAPI runs YOLO
- Detected defects appear in inspection detail
- Defects include source=ai_microservice and modelVersion=yolo-defect-v1
```

## Regression check instructions

Run MERN tests:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

Run AI service tests:

```bash
cd ai-service
pytest
```

Manual full flow:

```text
1. Login as admin/sub_admin/user.
2. Create inspection.
3. Add room.
4. Upload image.
5. Run AI Detection.
6. Verify defects appear.
7. Edit severity/notes.
8. Generate later reports if available.
9. Verify property/dashboard/auth/report features still work.
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
