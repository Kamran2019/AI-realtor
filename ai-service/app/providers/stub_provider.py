from app.core.config import MODEL_VERSION
from app.schemas.detection import Box, Detection, DetectionRequest


class StubDetectionProvider:
    provider = "stub"
    model_version = MODEL_VERSION

    def detect(self, payload: DetectionRequest) -> list[Detection]:
        image_url = str(payload.imageUrl).lower()

        if "crack" in image_url:
            return [
                Detection(
                    type="crack",
                    severity="medium",
                    confidence=0.78,
                    box=Box(x=80, y=120, w=280, h=60),
                    notes="Microservice stub detection: possible crack-like defect.",
                )
            ]

        if "damp" in image_url:
            return [
                Detection(
                    type="damp",
                    severity="medium",
                    confidence=0.74,
                    box=Box(x=96, y=88, w=240, h=160),
                    notes="Microservice stub detection: possible damp patch.",
                )
            ]

        if "mould" in image_url or "mold" in image_url:
            return [
                Detection(
                    type="mould",
                    severity="high",
                    confidence=0.81,
                    box=Box(x=64, y=110, w=190, h=130),
                    notes="Microservice stub detection: possible mould growth.",
                )
            ]

        return [
            Detection(
                type="poor_finish",
                severity="low",
                confidence=0.55,
                box=Box(x=40, y=60, w=160, h=100),
                notes="Microservice stub detection: possible poor finish.",
            )
        ]
