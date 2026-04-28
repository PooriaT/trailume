from datetime import date, datetime, timezone

from app.models.domain import Activity
from app.services.analytics.engine import AnalyticsEngine
from app.services.strava.schemas import StravaActivityResponse, normalize_activity


def test_strava_activity_normalization_extracts_map_fields() -> None:
    raw = StravaActivityResponse.model_validate(
        {
            "id": 123,
            "name": "Lunch Ride",
            "type": "Ride",
            "start_date": "2026-01-03T10:00:00Z",
            "distance": 12000,
            "total_elevation_gain": 140,
            "start_latlng": [49.2827, -123.1207],
            "end_latlng": [49.29, -123.11],
            "map": {"summary_polyline": "abc123"},
        }
    )

    activity = normalize_activity(raw)

    assert activity.start_latlng == (49.2827, -123.1207)
    assert activity.end_latlng == (49.29, -123.11)
    assert activity.summary_polyline == "abc123"


def test_strava_activity_normalization_safely_ignores_missing_or_invalid_map_fields() -> None:
    raw = StravaActivityResponse.model_validate(
        {
            "id": 123,
            "name": "Lunch Ride",
            "type": "Ride",
            "start_date": "2026-01-03T10:00:00Z",
            "distance": 12000,
            "start_latlng": [100, -123.1207],
            "end_latlng": [],
            "map": {"summary_polyline": "   "},
        }
    )

    activity = normalize_activity(raw)

    assert activity.start_latlng is None
    assert activity.end_latlng is None
    assert activity.summary_polyline is None


def test_strava_activity_normalization_uses_route_polyline_when_summary_is_missing() -> None:
    raw = StravaActivityResponse.model_validate(
        {
            "id": 123,
            "name": "Lunch Ride",
            "type": "Ride",
            "start_date": "2026-01-03T10:00:00Z",
            "distance": 12000,
            "map": {"polyline": "detailed123"},
        }
    )

    activity = normalize_activity(raw)

    assert activity.summary_polyline == "detailed123"


def test_analytics_map_data_includes_only_activities_with_geometry() -> None:
    insights = AnalyticsEngine().build_insights(
        [
            Activity(
                id="1",
                name="Mapped Ride",
                activity_type="cycling",
                start_time=datetime(2026, 1, 3, tzinfo=timezone.utc),
                distance_m=12000,
                elevation_gain_m=140,
                start_latlng=(49.2827, -123.1207),
                end_latlng=(49.29, -123.11),
                summary_polyline="abc123",
            ),
            Activity(
                id="2",
                name="No Map Ride",
                activity_type="cycling",
                start_time=datetime(2026, 1, 4, tzinfo=timezone.utc),
                distance_m=8000,
            ),
        ],
        "cycling",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 7),
    )

    assert insights.map_data is not None
    assert insights.map_data["isDemoData"] is False
    assert insights.map_data["activities"] == [
        {
            "id": "1",
            "name": "Mapped Ride",
            "startDate": "2026-01-03",
            "activityType": "cycling",
            "distanceM": 12000,
            "elevationGainM": 140,
            "startCoordinate": {"lat": 49.2827, "lng": -123.1207},
            "endCoordinate": {"lat": 49.29, "lng": -123.11},
            "summaryPolyline": "abc123",
        }
    ]


def test_analytics_map_data_is_absent_without_geometry() -> None:
    insights = AnalyticsEngine().build_insights(
        [
            Activity(
                id="1",
                name="Unmapped Ride",
                activity_type="cycling",
                start_time=datetime(2026, 1, 3, tzinfo=timezone.utc),
                distance_m=12000,
            )
        ],
        "cycling",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 7),
    )

    assert insights.map_data is None
