# Trailume API

FastAPI backend for Trailume MVP.

Default narrative model is `gemma4` via `OLLAMA_MODEL`.

## Required environment variables

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI` (default: `http://localhost:8000/api/v1/auth/strava/callback`)
- `WEB_APP_URL` (default: `http://localhost:3000`)

## Run

```bash
python3.13 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Test

```bash
source .venv/bin/activate
pytest
```
