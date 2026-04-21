from datetime import date, datetime, timezone

from app.models.domain import Activity
from app.services.analytics.engine import AnalyticsEngine


def test_build_insights_returns_summary_and_trends() -> None:
    activities = [
        Activity(
            id="2",
            name="Second",
            activity_type="cycling",
            start_time=datetime(2026, 1, 3, tzinfo=timezone.utc),
            distance_m=30000,
            elevation_gain_m=200,
            moving_time_s=3600,
            elapsed_time_s=3900,
        ),
        Activity(
            id="1",
            name="First",
            activity_type="cycling",
            start_time=datetime(2026, 1, 1, tzinfo=timezone.utc),
            distance_m=10000,
            elevation_gain_m=100,
            moving_time_s=1800,
            elapsed_time_s=2000,
        ),
    ]

    result = AnalyticsEngine().build_insights(
        activities,
        "cycling",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 3),
    )

    assert result.summary_metrics["activityCount"] == 2
    assert result.summary_metrics["totalDistanceM"] == 40000.0
    assert result.summary_metrics["totalMovingTimeS"] == 5400
    assert result.summary_metrics["averageSpeedMps"] == 7.4074
    assert result.chart_points[0]["date"] == "2026-01-01"
    assert result.chart_points[2]["date"] == "2026-01-03"
    assert result.metadata["rangeDays"] == 3
    assert result.insight_flags["hasFastestEffort"] is True


def test_build_insights_empty_range_has_stable_payload() -> None:
    result = AnalyticsEngine().build_insights(
        [],
        "all",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 3),
    )

    assert result.summary_metrics["activityCount"] == 0
    assert len(result.chart_points) == 3
    assert result.insight_flags["frequencyTrend"] == "flat"
    assert result.metadata["mostActiveDay"] is None


def test_average_speed_uses_only_timed_distance_and_zero_elevation_is_not_null() -> None:
    activities = [
        Activity(
            id="timed",
            name="Timed Ride",
            activity_type="cycling",
            start_time=datetime(2026, 2, 1, tzinfo=timezone.utc),
            distance_m=20000,
            elevation_gain_m=0,
            moving_time_s=4000,
            elapsed_time_s=4200,
        ),
        Activity(
            id="untimed",
            name="Imported activity without timing",
            activity_type="cycling",
            start_time=datetime(2026, 2, 2, tzinfo=timezone.utc),
            distance_m=10000,
            elevation_gain_m=0,
            moving_time_s=None,
            elapsed_time_s=None,
        ),
    ]

    result = AnalyticsEngine().build_insights(
        activities,
        "cycling",
        start_date=date(2026, 2, 1),
        end_date=date(2026, 2, 2),
    )

    assert result.summary_metrics["averageSpeedMps"] == 5.0
    assert result.summary_metrics["totalElevationGainM"] == 0.0
