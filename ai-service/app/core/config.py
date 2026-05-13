import os
from dataclasses import dataclass
from functools import lru_cache


SERVICE_NAME = "ai-defect-detection-service"
MODEL_VERSION = "defect-microservice-stub-v1"
SUPPORTED_PROVIDERS = {"stub"}


@dataclass(frozen=True)
class Settings:
    ai_service_env: str
    ai_provider: str
    model_path: str
    max_image_mb: int
    request_timeout_seconds: int

    @property
    def is_supported_provider(self) -> bool:
        return self.ai_provider in SUPPORTED_PROVIDERS


def _read_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default

    try:
        return int(value)
    except ValueError:
        return default


@lru_cache
def get_settings() -> Settings:
    return Settings(
        ai_service_env=os.getenv("AI_SERVICE_ENV", "development"),
        ai_provider=os.getenv("AI_PROVIDER", "stub").lower(),
        model_path=os.getenv("MODEL_PATH", "./models/defect-yolo.pt"),
        max_image_mb=_read_int("MAX_IMAGE_MB", 10),
        request_timeout_seconds=_read_int("REQUEST_TIMEOUT_SECONDS", 30),
    )
