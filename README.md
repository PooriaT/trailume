# Trailume MVP Monorepo

Trailume is an MVP web app that connects to Strava, analyzes activities in a selected date range, and generates a narrative recap powered by deterministic insights plus a local LLM (Ollama).

## Why this architecture

This repository is intentionally split between a TypeScript frontend and Python backend to keep concerns clear:

- **Frontend (`apps/web`)** focuses on UX and visualization.
- **Backend (`apps/api`)** owns provider integration, analytics, and narrative generation.
- **Future extensibility** is supported through module boundaries (provider adapter, analytics engine, narrative client).

### Tradeoffs

- **MVP-first persistence:** the scaffold currently uses in-memory/mock flow to keep iteration fast; this means recap data is not durable across restarts.
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

## 1) Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+
- (Optional but recommended) Ollama running locally

## 2) Configure environment

Copy `.env.example` values into environment files:

- `apps/web/.env.local`
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- `apps/api/.env`
  - Use backend variables from `.env.example`

## 3) Run backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 4) Run frontend

```bash
cd apps/web
pnpm install
pnpm dev
```

Frontend: http://localhost:3000  
Backend docs: http://localhost:8000/docs

## API flow (current scaffold)

1. Frontend calls `/api/v1/auth/strava/start` to get OAuth URL (mock-ready).
2. Strava callback endpoint `/api/v1/auth/strava/callback` is scaffolded for local integration testing.
3. User selects filters on dashboard.
4. Frontend calls `POST /api/v1/recaps/generate`.
5. Backend fetches activities (mock if Strava unavailable), computes deterministic insights, then asks narrative service for a story.
6. If Ollama fails/unavailable, backend returns deterministic fallback narrative and `narrative_source=fallback`.

## Tests

From `apps/api`:

```bash
python -m pytest
```

## TODO roadmap

### Strava integration
- [ ] Implement full OAuth callback token exchange and secure token storage.
- [ ] Add Strava activity pagination and rate-limit handling.
- [ ] Add athlete selection from authorized account(s).

### Analytics
- [ ] Add activity-type-specific insight strategies (cycling, running, swimming).
- [ ] Add trend metrics (weekly consistency, load deltas, PR detection).
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
