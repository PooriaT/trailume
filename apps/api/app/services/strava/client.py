from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.models.domain import Activity


class StravaService:
    def build_authorization_url(self) -> str:
        if not settings.strava_client_id:
            return "https://www.strava.com/oauth/authorize?client_id=mock-client"
        return (
            "https://www.strava.com/oauth/authorize"
            f"?client_id={settings.strava_client_id}"
            f"&redirect_uri={settings.strava_redirect_uri}"
            "&response_type=code&scope=read,activity:read_all"
        )

    def fetch_activities(self, start_date: datetime, end_date: datetime, activity_type: str) -> list[Activity]:
        sample = [
            Activity(
                id="a1",
                name="Hill Climb Session",
                activity_type="cycling",
                start_time=datetime.now(timezone.utc) - timedelta(days=5),
                distance_m=42000,
                elevation_gain_m=680,
            ),
            Activity(
                id="a2",
                name="Endurance Ride",
                activity_type="cycling",
                start_time=datetime.now(timezone.utc) - timedelta(days=3),
                distance_m=73500,
                elevation_gain_m=540,
            ),
            Activity(
                id="a3",
                name="Recovery Spin",
                activity_type="cycling",
                start_time=datetime.now(timezone.utc) - timedelta(days=1),
                distance_m=21000,
                elevation_gain_m=170,
            ),
        ]
        filtered = [
            activity
            for activity in sample
            if start_date.date() <= activity.start_time.date() <= end_date.date()
            and (activity_type == "all" or activity.activity_type == activity_type)
        ]
        return filtered
