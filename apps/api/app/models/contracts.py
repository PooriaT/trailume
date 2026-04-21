from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ActivityType = Literal["all", "cycling", "running", "swimming"]


class StravaAuthStatusResponse(BaseModel):
    connected: bool
    provider: str = "strava"
    athlete_name: str | None = Field(default=None, alias="athleteName")


class StravaAuthCallbackResponse(BaseModel):
    connected: bool
    provider: str = "strava"


class RecapGenerateRequest(BaseModel):
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    activity_type: ActivityType = Field(default="all", alias="activityType")


class KeyMetric(BaseModel):
    label: str
    value: str


class HighlightCard(BaseModel):
    id: str
    title: str
    value: str
    detail: str


class ChartPoint(BaseModel):
    date: str
    distance_km: float = Field(alias="distanceKm")
    activity_count: int = Field(alias="activityCount")


class TrendPoint(BaseModel):
    bucket_start: str = Field(alias="bucketStart")
    bucket_type: Literal["day", "week"] = Field(alias="bucketType")
    activity_count: int = Field(alias="activityCount")
    distance_km: float = Field(alias="distanceKm")


class StandoutActivity(BaseModel):
    id: str
    name: str
    reason: str
    distance_km: float = Field(alias="distanceKm")
    elevation_m: int = Field(alias="elevationM")
    moving_time_s: int | None = Field(default=None, alias="movingTimeS")


class ActivityTypeTotals(BaseModel):
    activity_count: int = Field(alias="activityCount")
    distance_m: float = Field(alias="distanceM")
    moving_time_s: int = Field(alias="movingTimeS")
    elapsed_time_s: int = Field(alias="elapsedTimeS")
    elevation_gain_m: float = Field(alias="elevationGainM")


class SummaryMetrics(BaseModel):
    activity_count: int = Field(alias="activityCount")
    total_distance_m: float = Field(alias="totalDistanceM")
    total_moving_time_s: int | None = Field(default=None, alias="totalMovingTimeS")
    total_elapsed_time_s: int | None = Field(default=None, alias="totalElapsedTimeS")
    total_elevation_gain_m: float | None = Field(default=None, alias="totalElevationGainM")
    average_distance_m: float = Field(alias="averageDistanceM")
    average_moving_time_s: float | None = Field(default=None, alias="averageMovingTimeS")
    average_speed_mps: float | None = Field(default=None, alias="averageSpeedMps")
    totals_by_activity_type: dict[str, ActivityTypeTotals] = Field(alias="totalsByActivityType")


class MostActiveDay(BaseModel):
    date: str
    activity_count: int = Field(alias="activityCount")
    distance_m: float = Field(alias="distanceM")


class RecapMetadata(BaseModel):
    selected_activity_type: str = Field(alias="selectedActivityType")
    start_date: str = Field(alias="startDate")
    end_date: str = Field(alias="endDate")
    range_days: int = Field(alias="rangeDays")
    has_elapsed_time_coverage: bool = Field(alias="hasElapsedTimeCoverage")
    has_moving_time_coverage: bool = Field(alias="hasMovingTimeCoverage")
    available_activity_types: list[str] = Field(alias="availableActivityTypes")
    most_active_day: MostActiveDay | None = Field(default=None, alias="mostActiveDay")


class InsightFlags(BaseModel):
    has_fastest_effort: bool = Field(alias="hasFastestEffort")
    has_strong_finish: bool = Field(alias="hasStrongFinish")
    has_slow_start: bool = Field(alias="hasSlowStart")
    frequency_trend: Literal["increasing", "decreasing", "flat"] = Field(alias="frequencyTrend")
    has_repeated_route_tendency: bool = Field(alias="hasRepeatedRouteTendency")
    repeated_route_name: str | None = Field(default=None, alias="repeatedRouteName")


class NarrativeBlock(BaseModel):
    title: str
    summary: str
    highlights: list[str] = Field(min_length=3, max_length=5)
    reflection: str
    source: Literal["ollama", "fallback"]


class RecapGenerateResponse(BaseModel):
    title: str
    narrative: NarrativeBlock
    summary_metrics: SummaryMetrics = Field(alias="summaryMetrics")
    key_metrics: list[KeyMetric] = Field(alias="keyMetrics")
    highlight_cards: list[HighlightCard] = Field(alias="highlightCards")
    chart_points: list[ChartPoint] = Field(alias="chartPoints")
    trend_series: list[TrendPoint] = Field(alias="trendSeries")
    standout_activities: list[StandoutActivity] = Field(alias="standoutActivities")
    insight_flags: InsightFlags = Field(alias="insightFlags")
    metadata: RecapMetadata


class ActivityResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    activity_type: str = Field(alias="activityType")
    start_time: str = Field(alias="startTime")
    distance_m: float = Field(alias="distanceM")
    elevation_gain_m: float = Field(alias="elevationGainM")


class ActivitiesListResponse(BaseModel):
    activities: list[ActivityResponse]
    empty: bool
    message: str | None = None
