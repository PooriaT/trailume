from datetime import date, datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.models.domain import Activity, InsightBundle
from app.services.narrative.models import NarrativeOutput
from app.services.strava.token_store import StravaSession, StravaTokenSet

client = TestClient(app)


def _session() -> tuple[str, StravaSession]:
    return (
        "session-1",
        StravaSession(
            state="state",
            tokens=StravaTokenSet(
                access_token="old-token",
                refresh_token="refresh",
                expires_at=2_000_000_000,
            ),
            athlete_id=123,
            athlete_name="Rider",
        ),
    )


def test_activities_route_returns_mapped_payload_without_external_calls(monkeypatch) -> None:
    class FakeStravaService:
        def ensure_valid_tokens(self, tokens):
            return tokens

        def fetch_activities(self, access_token, start_date, end_date, activity_type):
            assert access_token == "old-token"
            assert activity_type == "cycling"
            return [
                Activity(
                    id="1",
                    name="Lunch Ride",
                    activity_type="cycling",
                    start_time=datetime(2026, 1, 3, tzinfo=timezone.utc),
                    distance_m=23000,
                    elevation_gain_m=220,
                    moving_time_s=3500,
                    elapsed_time_s=3700,
                )
            ]

    monkeypatch.setattr("app.api.routes.activities.get_strava_session_or_401", lambda request: _session())
    monkeypatch.setattr("app.api.routes.activities.StravaService", FakeStravaService)

    response = client.get(
        "/api/v1/activities?start=2026-01-01T00:00:00Z&end=2026-01-31T23:59:59Z&type=cycling"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["empty"] is False
    assert body["activities"][0]["name"] == "Lunch Ride"
    assert body["activities"][0]["activityType"] == "cycling"


def test_recap_route_uses_mocked_services_and_returns_contract_shape(monkeypatch) -> None:
    class FakeStravaService:
        def ensure_valid_tokens(self, tokens):
            return tokens

        def fetch_activities(self, access_token, start_date, end_date, activity_type):
            return []

    class FakeAnalyticsEngine:
        def build_insights(self, activities, activity_type, *, start_date, end_date):
            return InsightBundle(
                title="Your Cycling Recap",
                summary_metrics={
                    "activityCount": 0,
                    "totalDistanceM": 0.0,
                    "totalMovingTimeS": None,
                    "totalElapsedTimeS": None,
                    "totalElevationGainM": None,
                    "averageDistanceM": 0.0,
                    "averageMovingTimeS": None,
                    "averageSpeedMps": None,
                    "totalsByActivityType": {},
                },
                key_metrics=[],
                highlight_cards=[],
                chart_points=[],
                trend_series=[],
                standout_activities=[],
                insight_flags={
                    "hasFastestEffort": False,
                    "hasStrongFinish": False,
                    "hasSlowStart": False,
                    "frequencyTrend": "flat",
                    "hasRepeatedRouteTendency": False,
                    "repeatedRouteName": None,
                },
                metadata={
                    "selectedActivityType": activity_type,
                    "startDate": start_date.isoformat(),
                    "endDate": end_date.isoformat(),
                    "rangeDays": 7,
                    "hasElapsedTimeCoverage": False,
                    "hasMovingTimeCoverage": False,
                    "availableActivityTypes": [],
                    "mostActiveDay": None,
                },
            )

    class FakeNarrativeService:
        def generate(self, payload):
            return NarrativeOutput(
                title=payload.recap_title,
                summary="Deterministic summary",
                highlights=["one", "two", "three"],
                reflection="Reflective close",
                source="fallback",
            )

    monkeypatch.setattr("app.api.routes.recaps.get_strava_session_or_401", lambda request: _session())
    monkeypatch.setattr("app.api.routes.recaps.StravaService", FakeStravaService)
    monkeypatch.setattr("app.api.routes.recaps.AnalyticsEngine", FakeAnalyticsEngine)
    monkeypatch.setattr("app.api.routes.recaps.NarrativeService", FakeNarrativeService)

    response = client.post(
        "/api/v1/recaps/generate",
        json={"startDate": "2026-01-01", "endDate": "2026-01-07", "activityType": "cycling"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Your Cycling Recap"
    assert body["narrative"]["source"] == "fallback"
    assert body["metadata"]["startDate"] == date(2026, 1, 1).isoformat()
