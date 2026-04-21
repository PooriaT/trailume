from dataclasses import dataclass
from datetime import datetime
from typing import Literal


ActivityType = Literal["cycling", "running", "swimming"]


@dataclass
class Activity:
    id: str
    name: str
    activity_type: ActivityType
    start_time: datetime
    distance_m: float
    elevation_gain_m: float


@dataclass
class InsightBundle:
    title: str
    narrative_seed: str
    key_metrics: list[dict[str, str]]
    chart_points: list[dict[str, float | str]]
    standout_activities: list[dict[str, str | float | int]]
