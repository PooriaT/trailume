from __future__ import annotations

from typing import Protocol

from app.services.narrative.models import NarrativeInput, NarrativeOutput


class NarrativeProvider(Protocol):
    provider_name: str

    def is_available(self) -> bool: ...

    def generate(self, payload: NarrativeInput) -> NarrativeOutput: ...
