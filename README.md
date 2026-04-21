# Trailume (MVP)

Trailume turns recent training activity into a polished recap page: metrics, highlight cards, trend charts, standout sessions, and narrative text.

This repo is intentionally practical: local-first, Strava-backed data ingestion, deterministic analytics, and optional local LLM narration via Ollama.

## Product overview

Trailume helps athletes answer: **"How did this period of training go?"**

Current MVP flow:
1. Connect Strava via OAuth.
2. Pick date range + activity type.
3. Preview matching activities.
4. Generate recap from deterministic analytics.
5. Add narrative layer from Ollama when available (or deterministic fallback).

## Architecture summary

Monorepo structure:

```text
apps/
  api/   FastAPI backend (Strava integration, analytics, narrative providers)
  web/   Next.js frontend (filters, recap rendering)
```

### Backend boundaries

- `services/strava`: provider integration (OAuth, token refresh, activity fetch/normalization).
- `services/analytics`: deterministic metrics/insight computation.
- `services/narrative`: narrative provider contract + Ollama provider + deterministic fallback.
- `api/routes`: thin HTTP layer, auth/session checks, response contracts.

### Frontend boundaries

- `src/lib/api.ts`: centralized API access + uniform error parsing (`ApiError`).
- `src/app/*`: page-level flows (`/`, `/dashboard`, `/recap`).
- `src/components/*`: presentational recap sections.
- `src/types/recap.ts`: contract-aligned response types.

## Local setup

## 1) Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.13+
- Optional: Ollama for local LLM narrative generation

## 2) Environment files

- Copy root `.env.example` values into:
  - `apps/web/.env.local`
  - `apps/api/.env`

## 3) Install dependencies

```bash
pnpm install
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

## 4) Run locally

From repo root (in one terminal):

```bash
pnpm dev
```

Or run separately:

```bash
pnpm dev:web
pnpm dev:api
```

URLs:
- Web: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`

## Environment variables

### Frontend (`apps/web/.env.local`)

- `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`)

### Backend (`apps/api/.env`)

Core:
- `API_HOST`
- `API_PORT`
- `APP_ENV`
- `WEB_APP_URL`

Strava:
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI` (default `http://localhost:8000/api/v1/auth/strava/callback`)

Ollama:
- `OLLAMA_BASE_URL` (default `http://localhost:11434`)
- `OLLAMA_MODEL` (default `gemma4`)
- `OLLAMA_TIMEOUT_SECONDS`
- `OLLAMA_TEMPERATURE`
- `OLLAMA_TOP_P`
- `OLLAMA_NUM_PREDICT`

Session cookie behavior:
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_SAMESITE`

## Strava setup

1. Go to `https://www.strava.com/settings/api` and create an app.
2. Set callback domain to `localhost` for local development.
3. Set backend values:
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `STRAVA_REDIRECT_URI=http://localhost:8000/api/v1/auth/strava/callback`
4. Start app and click **Connect with Strava** from `/`.

## Ollama setup

Install and run Ollama (`https://ollama.com/download`):

```bash
ollama serve
ollama pull gemma4
```

If you use a different model, set `OLLAMA_MODEL` accordingly.

Narrative behavior:
- If Ollama is healthy and model is present: primary provider = Ollama.
- Otherwise: fallback provider = deterministic narrative generator.

## Current MVP scope

Included:
- Strava OAuth login/status/callback.
- Strava activity retrieval within date range/type filters.
- Deterministic analytics payload (metrics, highlights, trend series, insight flags, standout activities).
- Narrative generation with clean provider boundary (`NarrativeProvider`).
- Recap page with sectioned UI.

Not included:
- Durable token persistence (current store is in-memory).
- Background jobs/async recap generation.
- Full map geometry rendering (UI section exists, geometry payload not wired).

## Known limitations

- In-memory token/session store resets when API restarts.
- Strava API rate-limit strategy is minimal for MVP.
- Narrative quality varies by local model quality/availability.
- No user account system beyond Strava session cookie.
- Single provider focus (Strava + Ollama) though interfaces are prepared for expansion.

## Scripts

From repo root:

- `pnpm dev` — run API + web concurrently
- `pnpm dev:web` — web only
- `pnpm dev:api` — API only
- `pnpm lint` — lint web + API
- `pnpm format` — format API
- `pnpm test:api` — run backend tests

## Roadmap

### R1: richer storytelling surface
- Richer map-based storytelling (route overlays, keyed moments, repeated-route visualization).
- Better scene-level recap composition from analytics clusters.

### R2: media output
- Short video generation from recap scenes (script + auto-selected visuals/segments).

### R3: comparative insight depth
- Compare-period feature (e.g., "last 30 days vs prior 30 days").

### R4: provider expansion
- Support for multiple activity data providers (while preserving normalized domain contracts).
- Support for more activity-specific insight logic (running, cycling, swimming, then additional sports).

### R5: LLM deployment evolution
- Migration path from local Ollama to cloud-hosted LLM providers behind the same narrative provider interface.
