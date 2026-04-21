# Trailume API

FastAPI backend for Trailume MVP.

## Narrative providers

Trailume uses a provider boundary for recap narrative generation:

- `OllamaNarrativeProvider` (primary)
- `DeterministicNarrativeProvider` (fallback)

If Ollama is unavailable or returns invalid output, fallback generation is used so recap requests still succeed.

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

## Poetry workflow

Requires Poetry 2.0+ (the backend uses `[dependency-groups]` in `pyproject.toml`).

Install dependencies:

```bash
poetry install
```

Run API:

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run tests:

```bash
poetry run pytest
```

Run lint/format:

```bash
poetry run ruff check app tests
poetry run ruff format app tests
```

## Run Ollama locally

```bash
ollama serve
ollama pull gemma4
```
