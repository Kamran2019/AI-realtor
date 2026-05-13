from time import perf_counter

from fastapi import FastAPI, HTTPException, Request, status

from app.core.config import MODEL_VERSION, SERVICE_NAME, get_settings
from app.core.logging import configure_logging, log_request
from app.schemas.detection import DetectionRequest, DetectionResponse
from app.services.detection_service import (
    DetectionProviderError,
    UnsupportedProviderError,
    detect_defects,
)


settings = get_settings()
logger = configure_logging(settings.ai_service_env)

app = FastAPI(title="AI Realtor Defect Detection Service")


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start_time = perf_counter()

    try:
        return await call_next(request)
    finally:
        active_settings = get_settings()
        duration_ms = (perf_counter() - start_time) * 1000
        log_request(
            logger,
            endpoint=request.url.path,
            provider=active_settings.ai_provider,
            model_version=MODEL_VERSION,
            duration_ms=duration_ms,
        )


@app.get("/health")
def health():
    active_settings = get_settings()
    return {
        "success": True,
        "service": SERVICE_NAME,
        "provider": active_settings.ai_provider,
        "modelVersion": MODEL_VERSION,
    }


@app.post("/detect", response_model=DetectionResponse)
def detect(payload: DetectionRequest) -> DetectionResponse:
    try:
        return detect_defects(payload)
    except UnsupportedProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI detection provider is not supported.",
        ) from exc
    except DetectionProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI detection provider failed.",
        ) from exc
