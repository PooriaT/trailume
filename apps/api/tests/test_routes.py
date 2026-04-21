from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_strava_auth_status_defaults_to_disconnected() -> None:
    response = client.get("/api/v1/auth/strava/status")
    assert response.status_code == 200
    assert response.json()["connected"] is False


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


def test_activities_requires_auth() -> None:
    response = client.get(
        "/api/v1/activities?start=2026-01-01T00:00:00Z&end=2026-01-31T23:59:59Z&type=all"
    )
    assert response.status_code == 401
