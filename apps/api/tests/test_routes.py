from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_recap_endpoint_returns_contract_shape() -> None:
    response = client.post(
        "/api/v1/recaps/generate",
        json={"startDate": "2026-01-01", "endDate": "2026-01-31", "activityType": "all"},
    )
    assert response.status_code == 200

    body = response.json()
    assert "title" in body
    assert "narrativeSummary" in body
    assert "narrativeSource" in body
    assert "keyMetrics" in body
    assert "chartPoints" in body
    assert "standoutActivities" in body
