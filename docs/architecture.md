# Trailume Architecture (MVP)

## System shape

- **Web (`apps/web`)**: Next.js UI for auth, filtering, preview, and recap presentation.
- **API (`apps/api`)**: FastAPI service for provider integration, deterministic analytics, and narrative generation.

## Core backend flows

1. Strava OAuth (`/auth/strava/login` -> callback -> session cookie).
2. Session-backed activity fetch (`/activities`).
3. Recap generation (`/recaps/generate`):
   - Validate/authenticate session.
   - Fetch normalized activities from Strava.
   - Build deterministic `InsightBundle`.
   - Generate narrative using provider boundary:
     - Primary: Ollama provider
     - Fallback: deterministic provider

## Module boundaries

- `services/strava`: external provider access + token lifecycle.
- `services/analytics`: deterministic computation only; no provider/network dependencies.
- `services/narrative`: provider interface and implementations; consumes analytics output only.
- `api/routes`: HTTP input/output contracts and error/status mapping.

## Design principles

- Keep MVP behavior deterministic-first.
- Keep provider seams explicit for future expansion.
- Keep route handlers thin and predictable.
- Fail gracefully at provider edges and preserve usable UI states.
