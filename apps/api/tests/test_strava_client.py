from datetime import datetime, timezone
from urllib.parse import parse_qs, urlparse

import pytest

from app.services.strava.client import StravaAPIError, StravaService
from app.services.strava.client import settings as strava_settings


def test_authorization_url_rejects_placeholder_client_id(monkeypatch: pytest.MonkeyPatch) -> None:
    service = StravaService()

    monkeypatch.setattr(strava_settings, "strava_client_id", "your_client_id")

    with pytest.raises(StravaAPIError, match="STRAVA_CLIENT_ID is not configured"):
        service.build_authorization_url(state="state")


def test_authorization_url_requires_numeric_client_id(monkeypatch: pytest.MonkeyPatch) -> None:
    service = StravaService()

    monkeypatch.setattr(strava_settings, "strava_client_id", "not-a-number")

    with pytest.raises(StravaAPIError, match="numeric Client ID"):
        service.build_authorization_url(state="state")


def test_authorization_url_forces_activity_scope(monkeypatch: pytest.MonkeyPatch) -> None:
    service = StravaService()

    monkeypatch.setattr(strava_settings, "strava_client_id", "123456")
    monkeypatch.setattr(
        strava_settings,
        "strava_redirect_uri",
        "http://localhost:8000/api/v1/auth/strava/callback",
    )

    parsed = urlparse(service.build_authorization_url(state="state"))
    params = parse_qs(parsed.query)

    assert params["approval_prompt"] == ["force"]
    assert params["scope"] == ["read,activity:read,activity:read_all"]
    assert params["state"] == ["state"]


def test_required_activity_scope_accepts_activity_read() -> None:
    service = StravaService()

    assert service.has_required_activity_scope("read,activity:read") is True


def test_required_activity_scope_accepts_activity_read_all() -> None:
    service = StravaService()

    assert service.has_required_activity_scope("read,activity:read_all") is True


def test_required_activity_scope_rejects_read_only() -> None:
    service = StravaService()

    assert service.has_required_activity_scope("read") is False


def test_scope_parsing_supports_comma_and_space_separators() -> None:
    service = StravaService()

    comma_permissions = service.parse_permissions("read,activity:read")
    space_permissions = service.parse_permissions("read activity:read_all")

    assert comma_permissions.has_profile_read is True
    assert comma_permissions.has_activity_read is True
    assert comma_permissions.has_private_activity_read is False
    assert space_permissions.has_activity_read is True
    assert space_permissions.has_private_activity_read is True


def test_to_unix_utc_preserves_original_offset() -> None:
    service = StravaService()

    dt_with_offset = datetime.fromisoformat("2026-01-01T10:00:00+02:00")

    assert service._to_unix_utc(dt_with_offset) == int(
        datetime(2026, 1, 1, 8, 0, tzinfo=timezone.utc).timestamp()
    )


def test_to_unix_utc_supports_naive_values_as_utc() -> None:
    service = StravaService()

    naive_dt = datetime(2026, 1, 1, 8, 0, 0)

    assert service._to_unix_utc(naive_dt) == int(
        datetime(2026, 1, 1, 8, 0, tzinfo=timezone.utc).timestamp()
    )
