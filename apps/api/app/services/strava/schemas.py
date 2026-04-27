from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.domain import Activity


class StravaTokenResponse(BaseModel):
    token_type: str
    access_token: str
    refresh_token: str
    expires_at: int
    expires_in: int
    athlete: dict | None = None


class StravaAthleteResponse(BaseModel):
    id: int
    username: str | None = None
    firstname: str | None = None
    lastname: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None


class StravaActivityMap(BaseModel):
    polyline: str | None = None
    summary_polyline: str | None = None


class StravaActivityResponse(BaseModel):
    id: int
    name: str
    type: str
    start_date: datetime
    distance: float
    moving_time: int | None = None
    elapsed_time: int | None = None
    total_elevation_gain: float | None = None
    start_latlng: list[float] | None = None
    end_latlng: list[float] | None = None
    map: StravaActivityMap | None = None


def _normalize_latlng(value: list[float] | None) -> tuple[float, float] | None:
    if not value or len(value) != 2:
        return None

    lat = float(value[0])
    lng = float(value[1])
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None
    return (lat, lng)


def _normalize_polyline(value: str | None) -> str | None:
    if not value or not value.strip():
        return None
    return value.strip()


def _normalize_map_polyline(value: StravaActivityMap | None) -> str | None:
    if value is None:
        return None
    return _normalize_polyline(value.summary_polyline) or _normalize_polyline(value.polyline)


class ActivityItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    activity_type: Literal["cycling", "running", "swimming", "other"] = Field(alias="activityType")
    start_time: datetime = Field(alias="startTime")
    distance_m: float = Field(alias="distanceM")
    elevation_gain_m: float = Field(alias="elevationGainM")


def normalize_activity(raw: StravaActivityResponse) -> Activity:
    mapped_type = {
        "ride": "cycling",
        "run": "running",
        "swim": "swimming",
    }.get(raw.type.lower(), "other")

    return Activity(
        id=str(raw.id),
        name=raw.name,
        activity_type=mapped_type,
        start_time=raw.start_date,
        distance_m=raw.distance,
        elevation_gain_m=raw.total_elevation_gain or 0.0,
        moving_time_s=raw.moving_time,
        elapsed_time_s=raw.elapsed_time,
        start_latlng=_normalize_latlng(raw.start_latlng),
        end_latlng=_normalize_latlng(raw.end_latlng),
        summary_polyline=_normalize_map_polyline(raw.map),
    )


def to_activity_item(activity: Activity) -> ActivityItem:
    return ActivityItem(
        id=activity.id,
        name=activity.name,
        activityType=activity.activity_type,
        startTime=activity.start_time,
        distanceM=activity.distance_m,
        elevationGainM=activity.elevation_gain_m,
    )
