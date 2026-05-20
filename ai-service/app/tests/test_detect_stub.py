import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


@pytest.mark.parametrize(
    ("image_url", "expected_type", "expected_severity", "expected_confidence"),
    [
        ("http://localhost:5001/uploads/inspections/crack-wall.jpg", "crack", "medium", 0.78),
        ("http://localhost:5001/uploads/inspections/damp-wall.jpg", "damp", "medium", 0.74),
        ("http://localhost:5001/uploads/inspections/mould-ceiling.jpg", "mould", "high", 0.81),
        (
            "http://localhost:5001/uploads/inspections/paint-finish.jpg",
            "poor_finish",
            "low",
            0.55,
        ),
    ],
)
def test_detect_returns_expected_stub_detection(
    image_url,
    expected_type,
    expected_severity,
    expected_confidence,
):
    response = client.post(
        "/detect",
        json={
            "imageUrl": image_url,
            "inspectionId": "inspection-123",
            "roomId": "room-456",
            "imageIndex": 0,
        },
    )

    assert response.status_code == 200
    detection = response.json()["detections"][0]
    assert detection["type"] == expected_type
    assert detection["severity"] == expected_severity
    assert detection["confidence"] == expected_confidence


def test_detect_rejects_invalid_image_url():
    response = client.post("/detect", json={"imageUrl": "not-a-url"})

    assert response.status_code == 422


def test_detect_rejects_negative_image_index():
    response = client.post(
        "/detect",
        json={
            "imageUrl": "http://localhost:5001/uploads/inspections/crack-wall.jpg",
            "imageIndex": -1,
        },
    )

    assert response.status_code == 422


def test_detect_confidence_is_between_zero_and_one():
    response = client.post(
        "/detect",
        json={"imageUrl": "http://localhost:5001/uploads/inspections/crack-wall.jpg"},
    )

    detection = response.json()["detections"][0]
    assert 0 <= detection["confidence"] <= 1


def test_detect_response_includes_model_version():
    response = client.post(
        "/detect",
        json={"imageUrl": "http://localhost:5001/uploads/inspections/crack-wall.jpg"},
    )

    assert response.json()["modelVersion"] == "defect-microservice-stub-v1"
