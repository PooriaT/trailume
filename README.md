# Trailume MVP Monorepo

Trailume is an MVP web app that connects to Strava, analyzes activities in a selected date range, and generates a narrative recap powered by deterministic insights plus a local LLM (Ollama).

## Why this architecture

This repository is intentionally split between a TypeScript frontend and Python backend to keep concerns clear:

- **Frontend (`apps/web`)** focuses on UX and visualization.
- **Backend (`apps/api`)** owns provider integration, token handling, analytics, and narrative generation.
- **Future extensibility** is supported through module boundaries (provider adapter, analytics engine, narrative client).

### Tradeoffs

- **MVP token storage:** Strava OAuth tokens are stored in a backend in-memory store keyed by an opaque HTTP-only session cookie. This is secure enough for local MVP iteration but is not durable across backend restarts.
- **Synchronous generation:** recap generation is sync API for simplicity; later we can move to async jobs if latency grows.
- **Ollama optionality:** if Ollama is unavailable, backend returns a deterministic fallback narrative.

## Monorepo structure

```text
trailume/
  apps/
    web/                    # Next.js + TypeScript UI
    api/                    # FastAPI backend
  packages/
    shared-schema/          # placeholder for generated API client/types
  docs/
    architecture.md
  .env.example
  .gitignore
  pnpm-workspace.yaml
  README.md
```

## Local setup

### 1) Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.13+
- (Optional but recommended) Ollama running locally
- Default Ollama model for this scaffold: `gemma4` (override with `OLLAMA_MODEL`)

### 2) Configure environment

Copy `.env.example` values into environment files:

- `apps/web/.env.local`
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- `apps/api/.env`
  - `API_HOST=0.0.0.0`
  - `API_PORT=8000`
  - `APP_ENV=development`
  - `WEB_APP_URL=http://localhost:3000`
  - `STRAVA_CLIENT_ID=<from Strava app settings>`
  - `STRAVA_CLIENT_SECRET=<from Strava app settings>`
  - `STRAVA_REDIRECT_URI=http://localhost:8000/api/v1/auth/strava/callback`
  - `OLLAMA_BASE_URL=http://localhost:11434`
  - `OLLAMA_MODEL=gemma4`
  - `OLLAMA_TIMEOUT_SECONDS=45`

### 3) Configure Strava developer app (exact values)

1. Go to https://www.strava.com/settings/api and create an app.
2. Set **Authorization Callback Domain** to `localhost` for local development.
3. In your Trailume API env, set:
   - `STRAVA_CLIENT_ID` to the app Client ID
   - `STRAVA_CLIENT_SECRET` to the app Client Secret
   - `STRAVA_REDIRECT_URI` to `http://localhost:8000/api/v1/auth/strava/callback`
4. Ensure the frontend runs at `http://localhost:3000` and backend at `http://localhost:8000`.

### 4) Run backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5) Run frontend

```bash
cd apps/web
pnpm install
pnpm dev
```

Frontend: http://localhost:3000  
Backend docs: http://localhost:8000/docs

## API flow (MVP)

1. Frontend sends user to `GET /api/v1/auth/strava/login`.
2. Backend creates OAuth state, stores pending session server-side, and redirects to Strava.
3. Strava redirects to `GET /api/v1/auth/strava/callback`.
4. Backend exchanges code for tokens, fetches athlete profile, stores tokens in server memory, and redirects user back to frontend.
5. Frontend checks auth state via `GET /api/v1/auth/strava/status`.
6. Frontend fetches normalized activities via `GET /api/v1/activities?start=...&end=...&type=...`.
7. Recap generation still uses the deterministic/mock activity path for MVP continuity.

## Current Strava endpoints

- `GET /api/v1/auth/strava/login`
- `GET /api/v1/auth/strava/callback`
- `GET /api/v1/auth/strava/status`
- `GET /api/v1/activities?start=<iso>&end=<iso>&type=<optional>`


## Analytics recap payload notes

The recap API now returns a stable, typed payload with deterministic metrics and rule-based insight flags.

- **Deterministic only:** analytics are pure calculations over normalized activities; no LLM calls are used for metrics/highlights.
- **Missing-data behavior:** moving time, elapsed time, and elevation are reported as `null` when unavailable instead of inferring synthetic values.
- **Fastest effort metric:** fastest is selected by average moving speed (`distance / moving_time`) and requires at least 1 km to reduce noisy short-activity spikes.
- **Consistency and trend heuristics:**
  - Most consistent week = week with the highest number of active days (tie-breakers use activity count then date).
  - Frequency trend = compares first-half vs second-half activity density and reports `increasing`, `decreasing`, or `flat`.
- **Repeated-route tendency:** approximate signal based on normalized activity name repetition; emitted only when the same normalized name appears at least 3 times.

These heuristics intentionally favor conservative, explainable outputs over aggressive interpretation so the downstream narrative layer can remain honest.

## Tests

From `apps/api`:

```bash
python -m pytest
```

## TODO roadmap

### Strava integration
- [x] Implement OAuth code exchange and token refresh handling.
- [x] Normalize Strava activity data into internal domain model.
- [ ] Replace in-memory token storage with persistent encrypted storage.
- [ ] Add Strava rate-limit aware retry/backoff strategy.

### Analytics
- [ ] Add activity-type-specific insight strategies (cycling, running, swimming).
- [x] Add trend metrics (weekly consistency and frequency deltas).
- [ ] Add stronger standout ranking heuristics.

### Narrative
- [ ] Add prompt versioning and schema-constrained generation.
- [ ] Add narrative quality checks and regeneration endpoint.
- [ ] Add cloud LLM adapter while keeping the same interface.

### Frontend UX
- [ ] Add richer chart interactions and mobile polish.
- [ ] Add map route overlays with selectable standout activities.
- [ ] Add authenticated user session handling.

### Platform
- [ ] Add Docker Compose for one-command startup.
- [ ] Add CI lint/test workflows.
- [ ] Add persistence via SQLModel + Alembic migrations.
