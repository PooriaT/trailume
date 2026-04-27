from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.services.strava.permissions import StravaPermissions


@dataclass
class StravaTokenSet:
    access_token: str
    refresh_token: str
    expires_at: int


@dataclass
class StravaSession:
    state: str
    return_url: str | None = None
    tokens: StravaTokenSet | None = None
    athlete_id: int | None = None
    athlete_name: str | None = None
    permissions: StravaPermissions = field(default_factory=StravaPermissions)


class InMemoryStravaTokenStore:
    def __init__(self) -> None:
        self._sessions: dict[str, StravaSession] = {}

    def create_pending_session(self, session_id: str, state: str, return_url: str | None = None) -> None:
        self._sessions[session_id] = StravaSession(state=state, return_url=return_url)

    def get_session(self, session_id: str) -> StravaSession | None:
        return self._sessions.get(session_id)

    def set_tokens(
        self,
        session_id: str,
        *,
        access_token: str,
        refresh_token: str,
        expires_at: int,
        athlete_id: int | None,
        athlete_name: str | None,
        permissions: StravaPermissions | None = None,
    ) -> None:
        session = self._sessions.get(session_id)
        if session is None:
            return
        session.tokens = StravaTokenSet(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
        )
        session.athlete_id = athlete_id
        session.athlete_name = athlete_name
        session.permissions = permissions or StravaPermissions()

    def update_tokens(self, session_id: str, token_set: StravaTokenSet) -> None:
        session = self._sessions.get(session_id)
        if session is None:
            return
        session.tokens = token_set

    def disconnect_session(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)

    def is_expired(self, session_id: str) -> bool:
        session = self._sessions.get(session_id)
        if not session or not session.tokens:
            return True
        return session.tokens.expires_at <= int(datetime.now(timezone.utc).timestamp())


strava_token_store = InMemoryStravaTokenStore()
