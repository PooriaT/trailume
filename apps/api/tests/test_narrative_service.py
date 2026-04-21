from app.services.narrative.models import NarrativeInput, NarrativeOutput
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


class _PrimaryInvalidHighlightsProvider:
    provider_name = "ollama"

    def is_available(self) -> bool:
        return True

    def generate(self, payload: NarrativeInput) -> NarrativeOutput:
        return NarrativeOutput(
            title=payload.recap_title,
            summary="primary",
            highlights=["only one"],
            reflection="primary",
            source="ollama",
        )


def test_narrative_service_falls_back_when_primary_highlights_are_invalid() -> None:
    output = NarrativeService(primary=_PrimaryInvalidHighlightsProvider()).generate(_sample_payload())

    assert output.source == "fallback"
    assert len(output.highlights) >= 3
