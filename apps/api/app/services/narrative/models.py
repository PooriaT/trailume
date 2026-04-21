from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NarrativeInput:
    recap_title: str
    summary_metrics: dict[str, object]
    highlight_cards: list[dict[str, str]]
    insight_flags: dict[str, object]
    metadata: dict[str, object]


@dataclass(frozen=True)
class NarrativeOutput:
    title: str
    summary: str
    highlights: list[str]
    reflection: str
    source: str
