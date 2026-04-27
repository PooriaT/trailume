from __future__ import annotations

from fastapi import HTTPException

from app.services.strava.client import StravaAPIError


def strava_http_exception(_error: StravaAPIError) -> HTTPException:
    return HTTPException(
        status_code=502,
        detail={
            "code": "STRAVA_UPSTREAM_ERROR",
            "message": "Strava could not be reached right now. Please try again in a moment.",
        },
    )


def activity_permission_exception() -> HTTPException:
    return HTTPException(
        status_code=403,
        detail={
            "code": "STRAVA_ACTIVITY_PERMISSION_MISSING",
            "message": (
                "Trailume needs Strava activity access to generate stories. "
                "Reconnect with Strava and approve activity access. Private activity access is optional."
            ),
        },
    )
