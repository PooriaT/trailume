from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal


ActivityType = Literal["cycling", "running", "swimming", "other"]


@dataclass
class Activity:
    id: str
    name: str
    activity_type: ActivityType
    start_time: datetime
    distance_m: float
    elevation_gain_m: float = 0.0
    moving_time_s: int | None = None
    elapsed_time_s: int | None = None


@dataclass
class InsightBundle:
    title: str
    narrative_seed: str
    summary_metrics: dict[str, float | int | None | dict[str, dict[str, float | int | None]]]
    key_metrics: list[dict[str, str]]
    highlight_cards: list[dict[str, str]]
    chart_points: list[dict[str, float | str | int]]
    trend_series: list[dict[str, float | str | int]]
    standout_activities: list[dict[str, str | float | int | None]]
    insight_flags: dict[str, bool | str | int | float | None]
    metadata: dict[str, str | int | bool | None | list[str] | dict[str, float | int | None]]


@dataclass
class WeekAggregate:
    week_start: date
    activity_count: int
    active_days: int
    distance_m: float
    elevation_gain_m: float
