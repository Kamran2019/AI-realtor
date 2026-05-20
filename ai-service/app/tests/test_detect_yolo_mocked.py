import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.providers import yolo_provider
from app.providers.yolo_provider import YoloDefectProvider
from app.utils.image_loader import (
    ImageDownloadTimeoutError,
    LoadedImage,
    UnsupportedImageTypeError,
)


client = TestClient(app)


class MockBox:
    cls = [0]
    conf = [0.88]
    xyxy = [[10, 20, 110, 120]]


class MockResult:
    names = {0: "crack"}
    boxes = [MockBox()]


class MockModel:
    names = {0: "crack"}

    def __call__(self, image, **kwargs):
        return [MockResult()]


@pytest.fixture(autouse=True)
def reset_settings_cache():
    get_settings.cache_clear()
    YoloDefectProvider.clear_model_cache()
    yield
    get_settings.cache_clear()
    YoloDefectProvider.clear_model_cache()


def configure_yolo(monkeypatch, tmp_path):
    model_path = tmp_path / "defect-yolo.pt"
    model_path.write_text("mock model")
    monkeypatch.setenv("AI_PROVIDER", "yolo")
    monkeypatch.setenv("MODEL_PATH", str(model_path))
    monkeypatch.setenv("YOLO_CONFIDENCE_THRESHOLD", "0.35")
    get_settings.cache_clear()
    return model_path


def fake_image_loader(image_url, settings):
    return LoadedImage(
        image=object(),
        width=1000,
        height=1000,
        content_type="image/jpeg",
    )


def test_health_works_with_yolo_provider_when_model_is_available(monkeypatch, tmp_path):
    configure_yolo(monkeypatch, tmp_path)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["provider"] == "yolo"
    assert response.json()["modelVersion"] == "yolo-defect-v1"
    assert response.json()["modelAvailable"] is True


def test_detect_uses_yolo_provider_with_mocked_model(monkeypatch, tmp_path):
    configure_yolo(monkeypatch, tmp_path)
    monkeypatch.setattr(YoloDefectProvider, "_load_model", lambda self: MockModel())
    monkeypatch.setattr(yolo_provider, "load_image", fake_image_loader)

    response = client.post("/detect", json={"imageUrl": "http://example.com/crack.jpg"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["provider"] == "yolo"
    assert body["modelVersion"] == "yolo-defect-v1"
    assert body["detections"][0]["type"] == "crack"
    assert body["detections"][0]["box"] == {"x": 10.0, "y": 20.0, "w": 100.0, "h": 100.0}


def test_detect_yolo_missing_model_file_returns_503(monkeypatch, tmp_path):
    monkeypatch.setenv("AI_PROVIDER", "yolo")
    monkeypatch.setenv("MODEL_PATH", str(tmp_path / "missing.pt"))
    get_settings.cache_clear()

    response = client.post("/detect", json={"imageUrl": "http://example.com/crack.jpg"})

    assert response.status_code == 503
    assert response.json()["detail"] == "AI model is not available."


def test_detect_rejects_invalid_image_url_with_yolo_provider(monkeypatch, tmp_path):
    configure_yolo(monkeypatch, tmp_path)

    response = client.post("/detect", json={"imageUrl": "not-a-url"})

    assert response.status_code == 422


def test_detect_yolo_unsupported_image_mime_returns_415(monkeypatch, tmp_path):
    configure_yolo(monkeypatch, tmp_path)
    monkeypatch.setattr(YoloDefectProvider, "_load_model", lambda self: MockModel())

    def raise_unsupported(image_url, settings):
        raise UnsupportedImageTypeError("Unsupported image MIME type.")

    monkeypatch.setattr(yolo_provider, "load_image", raise_unsupported)

    response = client.post("/detect", json={"imageUrl": "http://example.com/file.gif"})

    assert response.status_code == 415
    assert response.json()["detail"] == "Unsupported image type."


def test_detect_yolo_image_timeout_returns_504(monkeypatch, tmp_path):
    configure_yolo(monkeypatch, tmp_path)
    monkeypatch.setattr(YoloDefectProvider, "_load_model", lambda self: MockModel())

    def raise_timeout(image_url, settings):
        raise ImageDownloadTimeoutError("Image download timed out.")

    monkeypatch.setattr(yolo_provider, "load_image", raise_timeout)

    response = client.post("/detect", json={"imageUrl": "http://example.com/crack.jpg"})

    assert response.status_code == 504
    assert response.json()["detail"] == "Image download timed out."
