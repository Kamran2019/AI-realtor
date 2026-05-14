from app.core.config import get_settings
from app.providers.stub_provider import StubDetectionProvider
from app.providers.yolo_provider import (
    ModelUnavailableError,
    YoloDefectProvider,
    YoloInferenceError,
)
from app.schemas.detection import DetectionRequest, DetectionResponse
from app.utils.image_loader import ImageLoadError


class UnsupportedProviderError(RuntimeError):
    pass


class DetectionProviderError(RuntimeError):
    pass


def _get_provider(provider_name: str):
    if provider_name == "stub":
        return StubDetectionProvider()

    if provider_name == "yolo":
        return YoloDefectProvider()

    raise UnsupportedProviderError("Unsupported AI provider configured.")


def detect_defects(payload: DetectionRequest) -> DetectionResponse:
    settings = get_settings()
    provider = _get_provider(settings.ai_provider)

    try:
        result = provider.detect(payload)
    except (ImageLoadError, ModelUnavailableError, YoloInferenceError):
        raise
    except Exception as exc:
        raise DetectionProviderError("AI detection provider failed.") from exc

    if isinstance(result, DetectionResponse):
        return result

    return DetectionResponse(
        success=True,
        provider=provider.provider,
        modelVersion=provider.model_version,
        detections=result,
    )
