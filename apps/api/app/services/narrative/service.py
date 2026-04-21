from __future__ import annotations

import json

import httpx
from pydantic import ValidationError

from app.services.narrative.deterministic import DeterministicNarrativeProvider
from app.services.narrative.models import NarrativeInput, NarrativeOutput
from app.services.narrative.ollama import OllamaNarrativeProvider
from app.services.narrative.providers import NarrativeProvider


class NarrativeService:
    def __init__(
        self,
        primary: NarrativeProvider | None = None,
        fallback: NarrativeProvider | None = None,
    ) -> None:
        self.primary = primary or OllamaNarrativeProvider()
        self.fallback = fallback or DeterministicNarrativeProvider()

    def generate(self, payload: NarrativeInput) -> NarrativeOutput:
        if self.primary.is_available():
            try:
                generated = self.primary.generate(payload)
                if 3 <= len(generated.highlights) <= 5:
                    return generated
            except (
                OSError,
                ValueError,
                KeyError,
                TypeError,
                json.JSONDecodeError,
                ValidationError,
                httpx.HTTPError,
            ):
                pass

        return self.fallback.generate(payload)
