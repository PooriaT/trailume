from datetime import datetime, timezone

from app.services.strava.client import StravaService


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
