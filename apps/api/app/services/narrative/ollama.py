from typing import Literal

import httpx

from app.core.config import settings


class NarrativeService:
    def generate(self, narrative_seed: str) -> tuple[str, Literal["ollama", "fallback"]]:
        prompt = (
            "Write a concise, motivational recap in 3-5 sentences based only on these facts: "
            f"{narrative_seed}"
        )
        try:
            with httpx.Client(timeout=settings.ollama_timeout_seconds) as client:
                response = client.post(
                    f"{settings.ollama_base_url}/api/generate",
                    json={"model": settings.ollama_model, "prompt": prompt, "stream": False},
                )
                response.raise_for_status()
                data = response.json()
                text = data.get("response", "").strip()
                if text:
                    return text, "ollama"
        except (httpx.HTTPError, ValueError, KeyError):
            pass

        fallback = f"{narrative_seed} Keep the momentum going and build on this consistency."
        return fallback, "fallback"
