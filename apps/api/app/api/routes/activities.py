from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Request

from app.models.contracts import ActivitiesListResponse
from app.services.strava.client import StravaAPIError, StravaService
from app.services.strava.token_store import strava_token_store

router = APIRouter(tags=["activities"])

SESSION_COOKIE = "trailume_session"


@router.get("/activities", response_model=ActivitiesListResponse)
def get_activities(
    request: Request,
    start: datetime = Query(...),
    end: datetime = Query(...),
    type: str = Query(default="all"),
) -> ActivitiesListResponse:
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        raise HTTPException(status_code=401, detail="Not connected to Strava")

    session = strava_token_store.get_session(session_id)
    if not session or not session.tokens:
        raise HTTPException(status_code=401, detail="Strava authorization is required")

    service = StravaService()

    try:
        tokens = service.ensure_valid_tokens(session.tokens)
        if tokens.access_token != session.tokens.access_token:
            strava_token_store.update_tokens(session_id, tokens)
        activities = service.fetch_activities(
            access_token=tokens.access_token,
            start_date=start,
            end_date=end,
            activity_type=type,
        )
    except StravaAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not activities:
        return ActivitiesListResponse(activities=[], empty=True, message="No activities match your filters.")

    mapped = [
        {
            "id": item.id,
            "name": item.name,
            "activityType": item.activity_type,
            "startTime": item.start_time.isoformat(),
            "distanceM": item.distance_m,
            "elevationGainM": item.elevation_gain_m,
        }
        for item in activities
    ]
    return ActivitiesListResponse(activities=mapped, empty=False)
