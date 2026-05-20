from app.schemas.detection import Box


def _box_area_ratio(box: Box | None, image_width: int, image_height: int) -> float:
    if not box or image_width <= 0 or image_height <= 0:
        return 0.0

    return max(box.w, 0) * max(box.h, 0) / (image_width * image_height)


def map_severity(
    defect_type: str,
    confidence: float,
    box: Box | None,
    image_width: int,
    image_height: int,
) -> str:
    area_ratio = _box_area_ratio(box, image_width, image_height)

    if confidence >= 0.80 and area_ratio >= 0.15:
        return "high"

    if defect_type == "crack" and confidence >= 0.85:
        return "high"

    if defect_type == "mould" and confidence >= 0.80:
        return "high"

    if defect_type == "damp" and confidence >= 0.80 and area_ratio >= 0.10:
        return "high"

    if confidence >= 0.65:
        return "medium"

    return "low"
