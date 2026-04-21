# Trailume API

FastAPI backend for Trailume MVP.

## Narrative providers

Trailume supports a provider boundary for recap storytelling:

- `OllamaNarrativeProvider` (primary)
- `DeterministicNarrativeProvider` (fallback)

If Ollama is unavailable, the fallback provider is used automatically so recap generation still succeeds.

## Required environment variables

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI` (default: `http://localhost:8000/api/v1/auth/strava/callback`)
- `WEB_APP_URL` (default: `http://localhost:3000`)

### Ollama configuration

- `OLLAMA_BASE_URL` (default: `http://localhost:11434`)
- `OLLAMA_MODEL` (default: `gemma4`)
- `OLLAMA_TIMEOUT_SECONDS` (default: `45`)
- `OLLAMA_TEMPERATURE` (default: `0.2`)
- `OLLAMA_TOP_P` (default: `0.9`)
- `OLLAMA_NUM_PREDICT` (default: `320`)

## Run

```bash
python3.13 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Run Ollama locally

```bash
ollama serve
ollama pull gemma4
```

## Test

```bash
source .venv/bin/activate
pytest
```
