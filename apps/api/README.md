# Trailume API

FastAPI backend for Trailume MVP.

Default narrative model is `gemma4` via `OLLAMA_MODEL`.

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
