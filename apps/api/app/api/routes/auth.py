from fastapi import APIRouter

from app.models.contracts import StravaAuthCallbackResponse, StravaAuthStartResponse
from app.services.strava.client import StravaService

router = APIRouter(tags=["auth"])


@router.post("/auth/strava/start", response_model=StravaAuthStartResponse)
def start_strava_auth() -> StravaAuthStartResponse:
    service = StravaService()
    return StravaAuthStartResponse(authorizationUrl=service.build_authorization_url())


@router.get("/auth/strava/callback", response_model=StravaAuthCallbackResponse)
def strava_auth_callback(code: str) -> StravaAuthCallbackResponse:
    return StravaAuthCallbackResponse(connected=True, codePreview=f"{code[:6]}...")
