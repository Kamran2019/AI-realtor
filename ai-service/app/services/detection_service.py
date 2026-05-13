from app.core.config import get_settings
from app.providers.stub_provider import StubDetectionProvider
from app.schemas.detection import DetectionRequest, DetectionResponse


class UnsupportedProviderError(RuntimeError):
    pass


class DetectionProviderError(RuntimeError):
    pass


def _get_provider(provider_name: str) -> StubDetectionProvider:
    if provider_name == "stub":
        return StubDetectionProvider()

    raise UnsupportedProviderError("Unsupported AI provider configured.")


def detect_defects(payload: DetectionRequest) -> DetectionResponse:
    settings = get_settings()
    provider = _get_provider(settings.ai_provider)

    try:
        detections = provider.detect(payload)
    except Exception as exc:
        raise DetectionProviderError("AI detection provider failed.") from exc

    return DetectionResponse(
        success=True,
        provider=provider.provider,
        modelVersion=provider.model_version,
        detections=detections,
    )
