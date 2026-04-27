from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.models.domain import Activity
from app.services.strava.schemas import (
    StravaActivityResponse,
    StravaAthleteResponse,
    StravaTokenResponse,
    normalize_activity,
)
from app.services.strava.permissions import StravaPermissions
from app.services.strava.token_store import StravaTokenSet


class StravaAPIError(Exception):
    pass


def _is_configured(value: str, placeholder: str) -> bool:
    return bool(value and value.strip() and value != placeholder)


class StravaService:
    auth_base_url = "https://www.strava.com/oauth/authorize"
    token_url = "https://www.strava.com/oauth/token"
    api_base_url = "https://www.strava.com/api/v3"
    requested_scopes = ("read", "activity:read", "activity:read_all")

    def build_authorization_url(self, *, state: str) -> str:
        if not _is_configured(settings.strava_client_id, "your_client_id"):
            raise StravaAPIError("STRAVA_CLIENT_ID is not configured")
        if not settings.strava_client_id.isdigit():
            raise StravaAPIError("STRAVA_CLIENT_ID must be the numeric Client ID from Strava")
        params = {
            "client_id": settings.strava_client_id,
            "redirect_uri": settings.strava_redirect_uri,
            "response_type": "code",
            "approval_prompt": "force",
            "scope": ",".join(self.requested_scopes),
            "state": state,
        }
        return f"{self.auth_base_url}?{urlencode(params)}"

    def parse_permissions(self, scope: str | None) -> StravaPermissions:
        return StravaPermissions.from_scope_string(scope)

    def has_required_activity_scope(self, scope: str | None) -> bool:
        return self.parse_permissions(scope).has_activity_read

    def exchange_authorization_code(self, code: str) -> StravaTokenResponse:
        payload = {
            "client_id": settings.strava_client_id,
            "client_secret": settings.strava_client_secret,
            "code": code,
            "grant_type": "authorization_code",
        }
        return self._request_tokens(payload)

    def refresh_access_token(self, refresh_token: str) -> StravaTokenResponse:
        payload = {
            "client_id": settings.strava_client_id,
            "client_secret": settings.strava_client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        return self._request_tokens(payload)

    def _request_tokens(self, payload: dict[str, str]) -> StravaTokenResponse:
        if not _is_configured(settings.strava_client_id, "your_client_id") or not _is_configured(
            settings.strava_client_secret, "your_client_secret"
        ):
            raise StravaAPIError("Strava credentials are not configured")

        try:
            response = httpx.post(self.token_url, data=payload, timeout=20)
            response.raise_for_status()
            return StravaTokenResponse.model_validate(response.json())
        except httpx.HTTPStatusError as exc:
            raise StravaAPIError(f"Token exchange failed: {exc.response.text}") from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise StravaAPIError("Token exchange failed due to network/parse error") from exc

    def ensure_valid_tokens(self, tokens: StravaTokenSet) -> StravaTokenSet:
        now_epoch = int(datetime.now(timezone.utc).timestamp())
        if tokens.expires_at > now_epoch + 30:
            return tokens

        refreshed = self.refresh_access_token(tokens.refresh_token)
        return StravaTokenSet(
            access_token=refreshed.access_token,
            refresh_token=refreshed.refresh_token,
            expires_at=refreshed.expires_at,
        )

    def fetch_athlete_profile(self, access_token: str) -> StravaAthleteResponse:
        try:
            response = httpx.get(
                f"{self.api_base_url}/athlete",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=20,
            )
            response.raise_for_status()
            return StravaAthleteResponse.model_validate(response.json())
        except httpx.HTTPStatusError as exc:
            raise StravaAPIError(f"Failed to fetch athlete profile: {exc.response.text}") from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise StravaAPIError("Failed to fetch athlete profile") from exc

    def fetch_activities(
        self,
        *,
        access_token: str,
        start_date: datetime,
        end_date: datetime,
        activity_type: str | None = None,
    ) -> list[Activity]:
        params = {
            "after": self._to_unix_utc(start_date),
            "before": self._to_unix_utc(end_date),
            "page": 1,
            "per_page": 100,
        }

        activities: list[Activity] = []
        while True:
            try:
                response = httpx.get(
                    f"{self.api_base_url}/athlete/activities",
                    params=params,
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=20,
                )
                response.raise_for_status()
                raw_batch = [
                    StravaActivityResponse.model_validate(item) for item in response.json()
                ]
            except httpx.HTTPStatusError as exc:
                raise StravaAPIError(f"Failed to fetch activities: {exc.response.text}") from exc
            except (httpx.HTTPError, ValueError) as exc:
                raise StravaAPIError("Failed to fetch activities") from exc

            if not raw_batch:
                break

            normalized = [normalize_activity(item) for item in raw_batch]
            if activity_type and activity_type != "all":
                normalized = [item for item in normalized if item.activity_type == activity_type]
            activities.extend(normalized)

            if len(raw_batch) < 100:
                break
            params["page"] += 1

        return activities

    def _to_unix_utc(self, value: datetime) -> int:
        if value.tzinfo is None:
            return int(value.replace(tzinfo=timezone.utc).timestamp())
        return int(value.astimezone(timezone.utc).timestamp())
