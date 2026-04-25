from fastapi.testclient import TestClient

from app.api.session import SESSION_COOKIE_NAME
from app.main import app
from app.services.strava.token_store import strava_token_store


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_strava_auth_status_defaults_to_disconnected() -> None:
    response = client.get("/api/v1/auth/strava/status")
    assert response.status_code == 200
    assert response.json()["connected"] is False


def test_recap_endpoint_requires_auth() -> None:
    response = client.post(
        "/api/v1/recaps/generate",
        json={"startDate": "2026-01-01", "endDate": "2026-01-31", "activityType": "all"},
    )
    assert response.status_code == 401


def test_activities_requires_auth() -> None:
    response = client.get(
        "/api/v1/activities?start=2026-01-01T00:00:00Z&end=2026-01-31T23:59:59Z&type=all"
    )
    assert response.status_code == 401


def test_disconnect_strava_is_safe_without_session() -> None:
    response = TestClient(app).post("/api/v1/auth/strava/disconnect")

    assert response.status_code == 200
    assert response.json() == {
        "connected": False,
        "provider": "strava",
        "message": "Disconnected from Strava",
    }


def test_disconnect_strava_clears_tokens_and_session_cookie() -> None:
    session_id = "disconnect-test-session"
    strava_token_store.create_pending_session(session_id, "state")
    strava_token_store.set_tokens(
        session_id,
        access_token="access",
        refresh_token="refresh",
        expires_at=2_000_000_000,
        athlete_id=123,
        athlete_name="Casey",
    )

    test_client = TestClient(app)
    test_client.cookies.set(SESSION_COOKIE_NAME, session_id)

    response = test_client.post("/api/v1/auth/strava/disconnect")

    assert response.status_code == 200
    assert response.json()["connected"] is False
    assert strava_token_store.get_session(session_id) is None
    assert f"{SESSION_COOKIE_NAME}=" in response.headers["set-cookie"]
    assert "Max-Age=0" in response.headers["set-cookie"]
