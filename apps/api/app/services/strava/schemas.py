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


class StravaActivityResponse(BaseModel):
    id: int
    name: str
    type: str
    start_date: datetime
    distance: float
    total_elevation_gain: float


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
        elevation_gain_m=raw.total_elevation_gain,
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
