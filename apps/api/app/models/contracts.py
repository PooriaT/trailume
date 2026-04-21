from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

ActivityType = Literal["all", "cycling", "running", "swimming"]


class StravaAuthStartResponse(BaseModel):
    authorization_url: str = Field(alias="authorizationUrl")


class StravaAuthCallbackResponse(BaseModel):
    connected: bool
    provider: str = "strava"
    code_preview: str = Field(alias="codePreview")


class RecapGenerateRequest(BaseModel):
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    activity_type: ActivityType = Field(default="all", alias="activityType")


class KeyMetric(BaseModel):
    label: str
    value: str


class ChartPoint(BaseModel):
    date: str
    distance_km: float = Field(alias="distanceKm")


class StandoutActivity(BaseModel):
    id: str
    name: str
    reason: str
    distance_km: float = Field(alias="distanceKm")
    elevation_m: int = Field(alias="elevationM")


class RecapGenerateResponse(BaseModel):
    title: str
    narrative_summary: str = Field(alias="narrativeSummary")
    narrative_source: Literal["ollama", "fallback"] = Field(alias="narrativeSource")
    key_metrics: list[KeyMetric] = Field(alias="keyMetrics")
    chart_points: list[ChartPoint] = Field(alias="chartPoints")
    standout_activities: list[StandoutActivity] = Field(alias="standoutActivities")
