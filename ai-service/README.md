# AI Realtor Defect Detection Service

Standalone FastAPI microservice foundation for future AI property defect detection.
This phase uses a deterministic stub provider only; it does not run YOLO inference and is not wired into the MERN backend yet.

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
  "modelVersion": "defect-microservice-stub-v1"
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
