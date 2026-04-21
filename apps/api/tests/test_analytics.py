from datetime import datetime, timezone

from app.models.domain import Activity
from app.services.analytics.engine import AnalyticsEngine


def test_build_insights_returns_sorted_chart_points_and_metrics() -> None:
    activities = [
        Activity(
            id="2",
            name="Second",
            activity_type="cycling",
            start_time=datetime(2026, 1, 3, tzinfo=timezone.utc),
            distance_m=30000,
            elevation_gain_m=200,
        ),
        Activity(
            id="1",
            name="First",
            activity_type="cycling",
            start_time=datetime(2026, 1, 1, tzinfo=timezone.utc),
            distance_m=10000,
            elevation_gain_m=100,
        ),
    ]

    result = AnalyticsEngine().build_insights(activities, "cycling")

    assert result.key_metrics[0]["value"] == "2"
    assert result.key_metrics[1]["value"] == "40.0 km"
    assert result.key_metrics[2]["value"] == "20.0 km"
    assert result.chart_points[0]["date"] == "2026-01-01"
    assert result.chart_points[1]["date"] == "2026-01-03"
