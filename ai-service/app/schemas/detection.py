from typing import Literal

from pydantic import AnyHttpUrl, BaseModel, Field


DefectType = Literal["crack", "damp", "mould", "poor_finish"]
Severity = Literal["low", "medium", "high"]


class DetectionRequest(BaseModel):
    imageUrl: AnyHttpUrl
    inspectionId: str | None = None
    roomId: str | None = None
    imageIndex: int | None = Field(default=None, ge=0)


class Box(BaseModel):
    x: float
    y: float
    w: float
    h: float


class Detection(BaseModel):
    type: DefectType
    severity: Severity
    confidence: float = Field(ge=0, le=1)
    box: Box | None = None
    notes: str | None = None


class DetectionResponse(BaseModel):
    success: bool
    provider: str
    modelVersion: str
    detections: list[Detection]
