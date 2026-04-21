from datetime import datetime

from fastapi import APIRouter, Query, Request

from app.api.errors import strava_http_exception
from app.api.session import get_strava_session_or_401
from app.models.contracts import ActivitiesListResponse
from app.services.strava.client import StravaAPIError, StravaService
from app.services.strava.token_store import strava_token_store

router = APIRouter(tags=["activities"])


@router.get("/activities", response_model=ActivitiesListResponse)
def get_activities(
    request: Request,
    start: datetime = Query(...),
    end: datetime = Query(...),
    type: str = Query(default="all"),
) -> ActivitiesListResponse:
    session_id, session = get_strava_session_or_401(request)
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
        raise strava_http_exception(exc) from exc

    if not activities:
        return ActivitiesListResponse(
            activities=[], empty=True, message="No activities match your filters."
        )

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
