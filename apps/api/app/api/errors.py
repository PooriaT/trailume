from __future__ import annotations

from fastapi import HTTPException

from app.services.strava.client import StravaAPIError


def strava_http_exception(error: StravaAPIError) -> HTTPException:
    return HTTPException(status_code=502, detail=str(error))
