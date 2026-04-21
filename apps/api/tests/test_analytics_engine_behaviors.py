from datetime import date, datetime, timedelta, timezone

from app.models.domain import Activity
from app.services.analytics.engine import AnalyticsEngine


def _activity(index: int, when: date, *, distance_m: float, name: str = "Route") -> Activity:
    return Activity(
        id=str(index),
        name=name,
        activity_type="cycling",
        start_time=datetime.combine(when, datetime.min.time(), tzinfo=timezone.utc),
        distance_m=distance_m,
        elevation_gain_m=100,
        moving_time_s=1800,
        elapsed_time_s=1900,
    )


def test_frequency_trend_detects_increasing_density() -> None:
    engine = AnalyticsEngine()
    activities = [
        _activity(1, date(2026, 1, 1), distance_m=10000),
        _activity(2, date(2026, 1, 7), distance_m=10000),
        _activity(3, date(2026, 1, 8), distance_m=10000),
        _activity(4, date(2026, 1, 9), distance_m=10000),
    ]

    assert engine._compute_frequency_trend(activities) == "increasing"


def test_finish_flag_detects_slow_start() -> None:
    engine = AnalyticsEngine()
    start = date(2026, 1, 1)
    activities = [
        _activity(day, start + timedelta(days=day), distance_m=30000)
        for day in range(3)
    ] + [
        _activity(day + 4, start + timedelta(days=day + 3), distance_m=10000)
        for day in range(3)
    ]

    assert engine._compute_finish_flag(activities) == "slow_start"


def test_repeated_route_tendency_normalizes_names_and_requires_three_occurrences() -> None:
    engine = AnalyticsEngine()
    activities = [
        _activity(1, date(2026, 1, 1), distance_m=10000, name="River Loop #1"),
        _activity(2, date(2026, 1, 2), distance_m=9000, name="River LOOP"),
        _activity(3, date(2026, 1, 3), distance_m=9500, name="river loop!!"),
        _activity(4, date(2026, 1, 4), distance_m=7000, name="Different Route"),
    ]

    assert engine._repeated_route_tendency(activities) == "river loop"
