from app.services.narrative.deterministic import DeterministicNarrativeProvider
from app.services.narrative.models import NarrativeInput
from app.services.narrative.service import NarrativeService


def _sample_payload() -> NarrativeInput:
    return NarrativeInput(
        recap_title="Your Cycling Recap",
        summary_metrics={
            "activityCount": 6,
            "totalDistanceM": 165000,
            "averageDistanceM": 27500,
            "totalElevationGainM": 1320,
        },
        highlight_cards=[
            {"title": "Longest activity", "value": "62.4 km", "detail": "Saturday Group Ride"},
            {"title": "Fastest effort", "value": "31.8 km/h", "detail": "City Loop"},
            {"title": "Highest-volume week", "value": "112.0 km", "detail": "2026-01-12"},
        ],
        insight_flags={
            "frequencyTrend": "increasing",
            "hasRepeatedRouteTendency": True,
            "repeatedRouteName": "River Path",
        },
        metadata={
            "rangeDays": 14,
            "selectedActivityType": "cycling",
            "mostActiveDay": {"date": "2026-01-14", "activityCount": 2},
        },
    )


def test_deterministic_provider_returns_required_sections() -> None:
    output = DeterministicNarrativeProvider().generate(_sample_payload())

    assert output.title == "Your Cycling Recap"
    assert output.summary
    assert 3 <= len(output.highlights) <= 5
    assert output.reflection
    assert output.source == "fallback"


class _UnavailablePrimaryProvider:
    provider_name = "ollama"

    def is_available(self) -> bool:
        return False

    def generate(self, payload: NarrativeInput):  # pragma: no cover - not reached
        raise AssertionError("should not be called")


def test_narrative_service_falls_back_when_primary_is_unavailable() -> None:
    service = NarrativeService(primary=_UnavailablePrimaryProvider())

    output = service.generate(_sample_payload())

    assert output.source == "fallback"
