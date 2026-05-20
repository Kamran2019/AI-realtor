import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


SERVICE_NAME = "ai-defect-detection-service"
STUB_MODEL_VERSION = "defect-microservice-stub-v1"
YOLO_MODEL_VERSION = "yolo-defect-v1"
MODEL_VERSION = STUB_MODEL_VERSION
SUPPORTED_PROVIDERS = {"stub", "yolo"}
SERVICE_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Settings:
    ai_service_env: str
    ai_provider: str
    model_path: str
    max_image_mb: int
    request_timeout_seconds: int
    yolo_confidence_threshold: float
    yolo_iou_threshold: float
    allow_private_image_urls: bool

    @property
    def is_supported_provider(self) -> bool:
        return self.ai_provider in SUPPORTED_PROVIDERS

    @property
    def resolved_model_path(self) -> Path:
        return resolve_model_path(self.model_path)


def _read_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default

    try:
        return int(value)
    except ValueError:
        return default


def _read_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default

    try:
        return float(value)
    except ValueError:
        return default


def _read_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def resolve_model_path(model_path: str) -> Path:
    path = Path(model_path).expanduser()
    if path.is_absolute():
        return path

    return SERVICE_ROOT / path


def get_model_version(provider_name: str) -> str:
    if provider_name == "yolo":
        return YOLO_MODEL_VERSION

    return STUB_MODEL_VERSION


@lru_cache
def get_settings() -> Settings:
    ai_service_env = os.getenv("AI_SERVICE_ENV", "development").lower()

    return Settings(
        ai_service_env=ai_service_env,
        ai_provider=os.getenv("AI_PROVIDER", "stub").lower(),
        model_path=os.getenv("MODEL_PATH", "app/models/defect-yolo.pt"),
        max_image_mb=_read_int("MAX_IMAGE_MB", 10),
        request_timeout_seconds=_read_int("REQUEST_TIMEOUT_SECONDS", 15),
        yolo_confidence_threshold=_read_float("YOLO_CONFIDENCE_THRESHOLD", 0.35),
        yolo_iou_threshold=_read_float("YOLO_IOU_THRESHOLD", 0.5),
        allow_private_image_urls=_read_bool(
            "ALLOW_PRIVATE_IMAGE_URLS",
            ai_service_env != "production",
        ),
    )
