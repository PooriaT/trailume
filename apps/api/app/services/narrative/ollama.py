from __future__ import annotations

import json

import httpx
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.narrative.models import NarrativeInput, NarrativeOutput


class _OllamaNarrativeShape(BaseModel):
    title: str
    summary: str
    highlights: list[str] = Field(min_length=3, max_length=5)
    reflection: str


class OllamaNarrativeProvider:
    provider_name = "ollama"

    def is_available(self) -> bool:
        if not settings.ollama_model:
            return False
        try:
            with httpx.Client(timeout=min(settings.ollama_timeout_seconds, 5)) as client:
                response = client.get(f"{settings.ollama_base_url}/api/tags")
                response.raise_for_status()
                tags = response.json().get("models", [])
                return any(model.get("name", "").startswith(settings.ollama_model) for model in tags)
        except (httpx.HTTPError, ValueError, KeyError, TypeError):
            return False

    def generate(self, payload: NarrativeInput) -> NarrativeOutput:
        prompt = self._build_prompt(payload)
        with httpx.Client(timeout=settings.ollama_timeout_seconds) as client:
            response = client.post(
                f"{settings.ollama_base_url}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": settings.ollama_temperature,
                        "top_p": settings.ollama_top_p,
                        "num_predict": settings.ollama_num_predict,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()

        raw_text = data.get("response", "")
        parsed = _OllamaNarrativeShape.model_validate(json.loads(raw_text))

        return NarrativeOutput(
            title=parsed.title.strip() or payload.recap_title,
            summary=parsed.summary.strip(),
            highlights=[item.strip() for item in parsed.highlights if item.strip()],
            reflection=parsed.reflection.strip(),
            source=self.provider_name,
        )

    def _build_prompt(self, payload: NarrativeInput) -> str:
        evidence = {
            "recapTitle": payload.recap_title,
            "summaryMetrics": payload.summary_metrics,
            "highlightCards": payload.highlight_cards,
            "insightFlags": payload.insight_flags,
            "metadata": payload.metadata,
        }
        return (
            "You are writing a factual fitness recap from structured analytics evidence only. "
            "Rules: do not invent facts, do not add unsupported emotions, keep language concise and polished, "
            "and only claim what is directly traceable to provided fields. "
            "Return strict JSON with keys: title (string), summary (string), highlights (array of 3-5 strings), "
            "reflection (string). No markdown, no code fences.\n"
            f"Evidence JSON:\n{json.dumps(evidence, separators=(',', ':'))}"
        )
