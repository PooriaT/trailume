import pytest
from pydantic import ValidationError

from app.models.contracts import NarrativeBlock, RecapGenerateRequest


def test_recap_generate_request_rejects_unknown_activity_type() -> None:
    with pytest.raises(ValidationError):
        RecapGenerateRequest.model_validate(
            {"startDate": "2026-01-01", "endDate": "2026-01-03", "activityType": "hiking"}
        )


def test_narrative_block_enforces_highlight_length_bounds() -> None:
    with pytest.raises(ValidationError):
        NarrativeBlock.model_validate(
            {
                "title": "Title",
                "summary": "Summary",
                "highlights": ["one", "two"],
                "reflection": "Reflection",
                "source": "fallback",
            }
        )
