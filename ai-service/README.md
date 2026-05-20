# AI Realtor Defect Detection Service

Standalone FastAPI microservice for AI property defect detection.
It supports the deterministic stub provider and a YOLO provider for real defect inference.

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The service runs at `http://localhost:8000`.

To run real YOLO inference, place the trained model at `app/models/defect-yolo.pt` and start with:

```bash
AI_PROVIDER=yolo MODEL_PATH=app/models/defect-yolo.pt uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## MERN Backend Integration

The MERN backend can call this service through its AI provider router. Start this service, then set the backend environment to:

```env
AI_PROVIDER=http
AI_SERVICE_URL=http://localhost:8000
AI_DETECTION_TIMEOUT_MS=30000
```

The React frontend continues to call the MERN endpoint; it should not call this FastAPI service directly.

## Test

```bash
pytest
```

## Endpoints

`GET /health`

```json
{
  "success": true,
  "service": "ai-defect-detection-service",
  "provider": "stub",
  "modelVersion": "defect-microservice-stub-v1",
  "modelAvailable": true
}
```

`POST /detect`

```json
{
  "imageUrl": "http://localhost:5001/uploads/inspections/crack-wall.jpg",
  "inspectionId": "optional",
  "roomId": "optional",
  "imageIndex": 0
}
```

The stub provider returns deterministic detections based on the image URL:

- `crack` in the URL returns a medium crack detection with confidence `0.78`.
- `damp` in the URL returns a medium damp detection with confidence `0.74`.
- `mould` or `mold` in the URL returns a high mould detection with confidence `0.81`.
- Any other valid URL returns a low poor finish detection with confidence `0.55`.

The YOLO provider downloads JPG, PNG, or WebP images up to `MAX_IMAGE_MB`, runs the configured model, maps known YOLO class names to the app defect enum, and returns only mapped detections. Unknown classes are skipped.

## YOLO Training

Training scripts and dataset scaffolding live under `app/training`.

```bash
python app/training/train_yolo.py --model yolo11n.pt --data app/training/data.yaml --epochs 50 --imgsz 640 --batch 16
python app/training/export_model.py --model runs/detect/train/weights/best.pt --output app/models/defect-yolo.pt
python app/training/evaluate_yolo.py --model app/models/defect-yolo.pt --data app/training/data.yaml
```

Before commercial release, verify the licenses for Ultralytics, pretrained model weights, and any datasets used for training.
