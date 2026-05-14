import pytest

from app.core.config import Settings
from app.providers.yolo_provider import YoloDefectProvider
from app.schemas.detection import DetectionRequest
from app.utils.image_loader import LoadedImage


class MockBox:
    def __init__(self, class_id, confidence, xyxy):
        self.cls = [class_id]
        self.conf = [confidence]
        self.xyxy = [xyxy]


class MockResult:
    def __init__(self, names, boxes):
        self.names = names
        self.boxes = boxes


class MockModel:
    def __init__(self, names, boxes):
        self.names = names
        self.boxes = boxes
        self.last_kwargs = None

    def __call__(self, image, **kwargs):
        self.last_kwargs = kwargs
        return [MockResult(self.names, self.boxes)]


def make_settings(confidence_threshold=0.35):
    return Settings(
        ai_service_env="test",
        ai_provider="yolo",
        model_path="app/models/defect-yolo.pt",
        max_image_mb=10,
        request_timeout_seconds=15,
        yolo_confidence_threshold=confidence_threshold,
        yolo_iou_threshold=0.5,
        allow_private_image_urls=True,
    )


def make_loaded_image(width=1000, height=1000):
    return LoadedImage(
        image=object(),
        width=width,
        height=height,
        content_type="image/jpeg",
    )


def fake_image_loader(image_url, settings):
    return make_loaded_image()


def detect_with_model(model, confidence_threshold=0.35):
    provider = YoloDefectProvider(
        settings=make_settings(confidence_threshold=confidence_threshold),
        model=model,
        image_loader=fake_image_loader,
    )
    return provider.detect(DetectionRequest(imageUrl="http://example.com/defect.jpg"))


@pytest.fixture(autouse=True)
def clear_yolo_cache():
    YoloDefectProvider.clear_model_cache()
    yield
    YoloDefectProvider.clear_model_cache()


def test_yolo_provider_maps_crack_class_to_crack_defect():
    model = MockModel({0: "crack"}, [MockBox(0, 0.82, [10, 20, 110, 120])])

    response = detect_with_model(model)

    assert response.provider == "yolo"
    assert response.modelVersion == "yolo-defect-v1"
    assert response.detections[0].type == "crack"


def test_yolo_provider_maps_mold_to_mould():
    model = MockModel({0: "mold"}, [MockBox(0, 0.82, [10, 20, 110, 120])])

    response = detect_with_model(model)

    assert response.detections[0].type == "mould"


def test_yolo_provider_skips_unknown_classes():
    model = MockModel({0: "ceiling_shadow"}, [MockBox(0, 0.91, [10, 20, 110, 120])])

    response = detect_with_model(model)

    assert response.detections == []


def test_yolo_provider_filters_low_confidence_detections():
    model = MockModel({0: "crack"}, [MockBox(0, 0.2, [10, 20, 110, 120])])

    response = detect_with_model(model, confidence_threshold=0.35)

    assert response.detections == []


def test_yolo_provider_converts_xyxy_box_to_xywh_pixels():
    model = MockModel({0: "crack"}, [MockBox(0, 0.82, [10, 20, 60, 120])])

    response = detect_with_model(model)

    box = response.detections[0].box
    assert box.x == 10.0
    assert box.y == 20.0
    assert box.w == 50.0
    assert box.h == 100.0


def test_yolo_provider_maps_high_severity_for_high_confidence_large_area():
    model = MockModel({0: "damp"}, [MockBox(0, 0.85, [0, 0, 500, 400])])

    response = detect_with_model(model)

    assert response.detections[0].severity == "high"


def test_yolo_provider_maps_medium_severity_for_medium_confidence():
    model = MockModel({0: "crack"}, [MockBox(0, 0.7, [0, 0, 100, 100])])

    response = detect_with_model(model)

    assert response.detections[0].severity == "medium"


def test_yolo_provider_returns_empty_detections_for_empty_model_output():
    model = MockModel({0: "crack"}, [])

    response = detect_with_model(model)

    assert response.success is True
    assert response.detections == []
    assert model.last_kwargs["conf"] == 0.35
    assert model.last_kwargs["iou"] == 0.5
