from collections.abc import Callable, Iterable

from app.core.config import Settings, YOLO_MODEL_VERSION, get_settings
from app.schemas.detection import Box, Detection, DetectionRequest, DetectionResponse
from app.utils.class_mapper import map_class_to_defect
from app.utils.image_loader import LoadedImage, load_image
from app.utils.severity_mapper import map_severity


class ModelUnavailableError(RuntimeError):
    pass


class YoloInferenceError(RuntimeError):
    pass


ImageLoader = Callable[[str, Settings | None], LoadedImage]


class YoloDefectProvider:
    provider = "yolo"
    model_version = YOLO_MODEL_VERSION
    _model_cache: dict[str, object] = {}

    def __init__(
        self,
        settings: Settings | None = None,
        model: object | None = None,
        image_loader: ImageLoader | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self._provided_model = model
        self._image_loader = image_loader or load_image

    @classmethod
    def clear_model_cache(cls) -> None:
        cls._model_cache.clear()

    def detect(self, request: DetectionRequest) -> DetectionResponse:
        model = self._load_model()
        loaded_image = self._image_loader(str(request.imageUrl), self.settings)

        try:
            results = model(
                loaded_image.image,
                conf=self.settings.yolo_confidence_threshold,
                iou=self.settings.yolo_iou_threshold,
                verbose=False,
            )
        except Exception as exc:
            raise YoloInferenceError("YOLO inference failed.") from exc

        try:
            detections = self._to_detections(results, loaded_image, model)
        except YoloInferenceError:
            raise
        except Exception as exc:
            raise YoloInferenceError("YOLO output could not be parsed.") from exc

        return DetectionResponse(
            success=True,
            provider=self.provider,
            modelVersion=self.model_version,
            detections=detections,
        )

    def _load_model(self):
        if self._provided_model is not None:
            return self._provided_model

        model_path = self.settings.resolved_model_path
        if not model_path.exists():
            raise ModelUnavailableError("AI model is not available.")

        cache_key = str(model_path)
        if cache_key in self._model_cache:
            return self._model_cache[cache_key]

        try:
            from ultralytics import YOLO

            model = YOLO(cache_key)
        except Exception as exc:
            raise YoloInferenceError("YOLO model could not be loaded.") from exc

        self._model_cache[cache_key] = model
        return model

    def _to_detections(
        self,
        results: object,
        loaded_image: LoadedImage,
        model: object,
    ) -> list[Detection]:
        detections: list[Detection] = []

        for result in _as_results(results):
            names = getattr(result, "names", None) or getattr(model, "names", {})

            for raw_box in _iter_boxes(getattr(result, "boxes", [])):
                confidence = _to_float(raw_box["confidence"])
                if confidence < self.settings.yolo_confidence_threshold:
                    continue

                class_name = _class_name(names, raw_box["class_id"])
                defect_type = map_class_to_defect(class_name)
                if defect_type is None:
                    continue

                box = _xyxy_to_box(raw_box["xyxy"])
                severity = map_severity(
                    defect_type,
                    confidence,
                    box,
                    loaded_image.width,
                    loaded_image.height,
                )
                detections.append(
                    Detection(
                        type=defect_type,
                        severity=severity,
                        confidence=round(confidence, 4),
                        box=box,
                    )
                )

        return detections


def _as_results(results: object) -> list[object]:
    if results is None:
        return []

    if isinstance(results, list | tuple):
        return list(results)

    return [results]


def _to_python(value: object) -> object:
    for method_name in ("detach", "cpu", "numpy", "tolist"):
        method = getattr(value, method_name, None)
        if callable(method):
            value = method()

    return value


def _flatten_one(value: object) -> object:
    value = _to_python(value)
    while isinstance(value, list | tuple) and len(value) == 1:
        value = value[0]
    return value


def _to_float(value: object) -> float:
    return float(_flatten_one(value))


def _to_xyxy(value: object) -> list[float]:
    raw_value = _flatten_one(value)
    if not isinstance(raw_value, list | tuple) or len(raw_value) != 4:
        raise YoloInferenceError("YOLO box is not in xyxy format.")

    return [float(point) for point in raw_value]


def _as_sequence(value: object) -> list[object]:
    value = _to_python(value)
    if value is None:
        return []

    if isinstance(value, list | tuple):
        return list(value)

    return [value]


def _iter_boxes(boxes: object) -> Iterable[dict[str, object]]:
    xyxy_values = getattr(boxes, "xyxy", None)
    confidence_values = getattr(boxes, "conf", None)
    class_values = getattr(boxes, "cls", None)

    if xyxy_values is not None and confidence_values is not None and class_values is not None:
        for xyxy, confidence, class_id in zip(
            _as_sequence(xyxy_values),
            _as_sequence(confidence_values),
            _as_sequence(class_values),
            strict=False,
        ):
            yield {"xyxy": xyxy, "confidence": confidence, "class_id": class_id}
        return

    if boxes is None:
        return

    for box in boxes:
        yield {
            "xyxy": getattr(box, "xyxy", None),
            "confidence": getattr(box, "conf", None),
            "class_id": getattr(box, "cls", None),
        }


def _class_name(names: object, class_id: object) -> str | None:
    raw_class_id = _flatten_one(class_id)
    if isinstance(raw_class_id, str) and not raw_class_id.isdigit():
        return raw_class_id

    index = int(raw_class_id)
    if isinstance(names, dict):
        return names.get(index) or names.get(str(index))

    if isinstance(names, list | tuple) and 0 <= index < len(names):
        return names[index]

    return None


def _xyxy_to_box(value: object) -> Box:
    x1, y1, x2, y2 = _to_xyxy(value)
    x = max(x1, 0)
    y = max(y1, 0)
    return Box(
        x=x,
        y=y,
        w=max(x2 - x1, 0),
        h=max(y2 - y1, 0),
    )
