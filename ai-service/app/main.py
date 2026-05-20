from time import perf_counter

from fastapi import FastAPI, HTTPException, Request, status

from app.core.config import SERVICE_NAME, get_model_version, get_settings
from app.core.logging import configure_logging, log_request
from app.providers.yolo_provider import ModelUnavailableError, YoloInferenceError
from app.schemas.detection import DetectionRequest, DetectionResponse
from app.services.detection_service import (
    DetectionProviderError,
    UnsupportedProviderError,
    detect_defects,
)
from app.utils.image_loader import (
    ImageDownloadTimeoutError,
    ImageLoadError,
    ImageTooLargeError,
    InvalidImageUrlError,
    UnsupportedImageTypeError,
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
            model_version=get_model_version(active_settings.ai_provider),
            duration_ms=duration_ms,
        )


@app.get("/health")
def health():
    active_settings = get_settings()
    model_available = (
        active_settings.resolved_model_path.exists()
        if active_settings.ai_provider == "yolo"
        else True
    )

    return {
        "success": True,
        "service": SERVICE_NAME,
        "provider": active_settings.ai_provider,
        "modelVersion": get_model_version(active_settings.ai_provider),
        "modelAvailable": model_available,
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
    except ModelUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model is not available.",
        ) from exc
    except InvalidImageUrlError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid image URL.",
        ) from exc
    except ImageDownloadTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Image download timed out.",
        ) from exc
    except UnsupportedImageTypeError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image type.",
        ) from exc
    except ImageTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds maximum size.",
        ) from exc
    except YoloInferenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI detection provider failed.",
        ) from exc
    except ImageLoadError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI image loader failed.",
        ) from exc
    except DetectionProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI detection provider failed.",
        ) from exc
