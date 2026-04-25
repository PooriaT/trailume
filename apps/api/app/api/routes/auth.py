from secrets import token_urlsafe

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from app.api.errors import strava_http_exception
from app.api.session import SESSION_COOKIE_NAME
from app.core.config import settings
from app.models.contracts import (
    StravaAuthCallbackResponse,
    StravaAuthStatusResponse,
    StravaDisconnectResponse,
)
from app.services.strava.client import StravaAPIError, StravaService
from app.services.strava.token_store import strava_token_store

router = APIRouter(tags=["auth"])


@router.get("/auth/strava/login")
def start_strava_auth() -> RedirectResponse:
    service = StravaService()
    session_id = token_urlsafe(24)
    state = token_urlsafe(24)
    strava_token_store.create_pending_session(session_id, state)

    try:
        auth_url = service.build_authorization_url(state=state)
    except StravaAPIError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    response = RedirectResponse(url=auth_url)
    cookie_secure = settings.session_cookie_secure
    cookie_samesite = settings.session_cookie_samesite

    if settings.web_app_url.startswith("https://") and not settings.session_cookie_secure:
        cookie_secure = True
    if (
        cookie_secure
        and settings.session_cookie_samesite == "lax"
        and settings.web_app_url.startswith("https://")
    ):
        cookie_samesite = "none"

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        max_age=60 * 60 * 24 * 30,
    )
    return response


@router.get("/auth/strava/callback", response_model=StravaAuthCallbackResponse)
def strava_auth_callback(
    request: Request, code: str | None = None, state: str | None = None, scope: str | None = None
) -> RedirectResponse:
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=401, detail="Missing auth session")

    session = strava_token_store.get_session(session_id)
    if not session or not state or session.state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    service = StravaService()
    if not service.has_required_activity_scope(scope):
        raise HTTPException(
            status_code=403,
            detail=(
                "Strava activity read permission was not granted. "
                "Reconnect with Strava and approve activity access."
            ),
        )

    try:
        tokens = service.exchange_authorization_code(code)
        athlete = service.fetch_athlete_profile(tokens.access_token)
    except StravaAPIError as exc:
        raise strava_http_exception(exc) from exc

    athlete_name = (
        " ".join(filter(None, [athlete.firstname, athlete.lastname])).strip() or athlete.username
    )

    strava_token_store.set_tokens(
        session_id,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        expires_at=tokens.expires_at,
        athlete_id=athlete.id,
        athlete_name=athlete_name,
    )

    return RedirectResponse(url=f"{settings.web_app_url}/dashboard?connected=strava")


@router.get("/auth/strava/status", response_model=StravaAuthStatusResponse)
def strava_auth_status(request: Request) -> StravaAuthStatusResponse:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        return StravaAuthStatusResponse(connected=False)
    session = strava_token_store.get_session(session_id)
    if not session or not session.tokens:
        return StravaAuthStatusResponse(connected=False)
    return StravaAuthStatusResponse(connected=True, athleteName=session.athlete_name)


@router.post("/auth/strava/disconnect", response_model=StravaDisconnectResponse)
def disconnect_strava(request: Request, response: Response) -> StravaDisconnectResponse:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        strava_token_store.disconnect_session(session_id)

    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    return StravaDisconnectResponse(message="Disconnected from Strava")
