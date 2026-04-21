from __future__ import annotations

from fastapi import HTTPException, Request

from app.services.strava.token_store import StravaSession, strava_token_store

SESSION_COOKIE_NAME = "trailume_session"


def get_strava_session_or_401(request: Request) -> tuple[str, StravaSession]:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=401, detail="Not connected to Strava")

    session = strava_token_store.get_session(session_id)
    if not session or not session.tokens:
        raise HTTPException(status_code=401, detail="Strava authorization is required")

    return session_id, session
