from secrets import token_urlsafe
from urllib.parse import urlencode, urlparse

from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse

from app.api.session import SESSION_COOKIE_NAME
from app.core.config import settings
from app.models.contracts import (
    StravaAuthCallbackResponse,
    StravaAuthStatusResponse,
    StravaDisconnectResponse,
)
from app.services.strava.client import StravaAPIError, StravaService
from app.services.strava.permissions import StravaPermissions
from app.services.strava.token_store import strava_token_store

router = APIRouter(tags=["auth"])


def _origin_from_url(value: str) -> str:
    parsed = urlparse(value)
    return f"{parsed.scheme}://{parsed.netloc}"


def _is_local_dev_origin(value: str) -> bool:
    parsed = urlparse(value)
    return (
        settings.app_env == "development"
        and parsed.scheme in {"http", "https"}
        and parsed.hostname in {"localhost", "127.0.0.1"}
        and parsed.port is not None
    )


def _validated_return_url(return_to: str | None) -> str:
    if not return_to:
        return settings.web_app_url

    parsed = urlparse(return_to)
    if not parsed.scheme or not parsed.netloc or parsed.path not in {"", "/"}:
        return settings.web_app_url

    candidate_origin = _origin_from_url(return_to)
    configured_origin = _origin_from_url(settings.web_app_url)
    if candidate_origin == configured_origin:
        return settings.web_app_url
    if _is_local_dev_origin(candidate_origin):
        return candidate_origin

    return settings.web_app_url


def _permission_payload(permissions: StravaPermissions) -> dict:
    return {
        "hasProfileRead": permissions.has_profile_read,
        "hasActivityRead": permissions.has_activity_read,
        "hasPrivateActivityRead": permissions.has_private_activity_read,
    }


def _dashboard_redirect_url(return_url: str, params: dict[str, str]) -> str:
    return f"{return_url}/dashboard?{urlencode(params)}"


@router.get("/auth/strava/login")
def start_strava_auth(return_to: str | None = Query(default=None)) -> RedirectResponse:
    service = StravaService()
    session_id = token_urlsafe(24)
    state = token_urlsafe(24)
    strava_token_store.create_pending_session(session_id, state, _validated_return_url(return_to))

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
    permissions = service.parse_permissions(scope)
    return_url = session.return_url or settings.web_app_url

    try:
        tokens = service.exchange_authorization_code(code)
    except StravaAPIError:
        return RedirectResponse(
            url=_dashboard_redirect_url(
                return_url,
                {"authError": "strava_connection_failed"},
            )
        )

    athlete = None
    if permissions.has_profile_read:
        try:
            athlete = service.fetch_athlete_profile(tokens.access_token)
        except StravaAPIError:
            athlete = None

    athlete_name = None
    if athlete:
        athlete_name = (
            " ".join(filter(None, [athlete.firstname, athlete.lastname])).strip() or athlete.username
        )

    strava_token_store.set_tokens(
        session_id,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        expires_at=tokens.expires_at,
        athlete_id=athlete.id if athlete else None,
        athlete_name=athlete_name,
        permissions=permissions,
    )

    params = {"connected": "strava", "activityAccess": permissions.activity_access}
    if not permissions.has_activity_read:
        params["authError"] = "activity_access_missing"

    return RedirectResponse(url=_dashboard_redirect_url(return_url, params))


@router.get("/auth/strava/status", response_model=StravaAuthStatusResponse)
def strava_auth_status(request: Request) -> StravaAuthStatusResponse:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        return StravaAuthStatusResponse(connected=False)
    session = strava_token_store.get_session(session_id)
    if not session or not session.tokens:
        return StravaAuthStatusResponse(connected=False)
    return StravaAuthStatusResponse(
        connected=True,
        athleteName=session.athlete_name,
        activityAccess=session.permissions.activity_access,
        permissions=_permission_payload(session.permissions),
    )


@router.post("/auth/strava/disconnect", response_model=StravaDisconnectResponse)
def disconnect_strava(request: Request, response: Response) -> StravaDisconnectResponse:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        strava_token_store.disconnect_session(session_id)

    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    return StravaDisconnectResponse(message="Disconnected from Strava")
