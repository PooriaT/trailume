# Trailume Architecture (Current MVP)

This document describes the **actual** architecture and boundaries implemented in the repository.

## 1) System overview

Trailume runs as two local services in a monorepo:

- **Frontend (`apps/web`)**: Next.js app that drives user flow and recap rendering.
- **Backend (`apps/api`)**: FastAPI app that handles Strava auth/data access, analytics, and narrative generation.

The frontend is intentionally thin; core business logic lives in the backend.

---

## 2) Frontend responsibilities (`apps/web`)

The frontend is responsible for:

- Starting and completing the Strava auth UX.
- Collecting recap inputs (date range + activity type).
- Calling backend APIs for activities and recap generation.
- Rendering recap sections (hero, metrics, trend charts, highlight cards, standout activities, narrative, flags).
- Handling API errors consistently through a centralized API client.

The frontend is **not** responsible for:

- Computing analytics.
- Generating narrative content.
- Calling Strava directly.

Those concerns stay in the backend.

---

## 3) Backend responsibilities (`apps/api`)

The backend owns all domain logic and provider integrations:

- Session handling around Strava OAuth.
- Strava token lifecycle management + activity retrieval.
- Deterministic analytics and insight computation.
- Narrative generation with provider orchestration and fallback.
- API contracts for frontend consumption.

Route handlers are intentionally thin adapters over services.

---

## 4) Strava integration boundary

Boundary location: `app/services/strava/*`

Responsibilities inside this boundary:

- Build Strava authorize URL.
- Exchange auth code for tokens.
- Refresh access tokens when needed.
- Fetch athlete activities from Strava.
- Normalize Strava activity payloads into Trailume domain models.
- Normalize optional map fields such as start/end coordinates and summary polylines.

Everything outside this boundary should consume normalized models and remain provider-agnostic.

Map data note:
- The MVP uses geographic fields already returned with Strava activity summaries when available.
- Detailed Strava stream fetching is not part of the current flow; add it only behind the Strava boundary and document endpoint usage if a future feature needs higher-fidelity route data.
- Recap API responses expose optional provider-neutral `mapData`, not raw Strava response objects.

Strava OAuth scope behavior:
- Trailume requests `read`, `activity:read`, and optional `activity:read_all`.
- `activity:read` is the required MVP activity capability and supports activities visible to Everyone or Followers.
- `activity:read_all` adds activities visible only to the athlete. Missing private activity access is not fatal; the UI notes that private activities are not included.
- If neither activity scope is granted, activity preview and recap generation return a structured permission error and the frontend prompts the user to reconnect.

Current MVP storage note:
- Token/session state is currently in-memory (`token_store`), not durable.

---

## 5) Analytics / insight engine boundary

Boundary location: `app/services/analytics/engine.py`

Responsibilities:

- Deterministically compute recap insights from normalized activities.
- Produce summary metrics, key metrics, highlights, trend series, standout activities, and metadata.
- Return stable output even when activity lists are empty.

Non-responsibilities:

- External HTTP/provider calls.
- Narrative prose generation.

The analytics engine is designed to be pure and testable.

---

## 6) Narrative generation boundary

Boundary location: `app/services/narrative/*`

Responsibilities:

- Define a `NarrativeProvider` contract.
- Implement providers:
  - `OllamaNarrativeProvider` (primary).
  - `DeterministicNarrativeProvider` (fallback).
- Orchestrate provider choice in `NarrativeService`.

Behavior:

1. Check primary provider availability.
2. Attempt generation with primary provider.
3. Validate shape constraints (3–5 highlights).
4. On failure/unavailability, fallback to deterministic provider.

This keeps recap generation functional when local LLMs are unavailable.

---

## 7) Ollama provider boundary + fallback behavior

Boundary location: `app/services/narrative/ollama.py`

Ollama provider responsibilities:

- Health/model availability check through Ollama tags endpoint.
- Prompt construction from analytics evidence only.
- Generate request to Ollama `/api/generate`.
- Parse and validate strict JSON narrative shape.

Fallback behavior is enforced by `NarrativeService`:

- Any Ollama unavailability, transport error, parse error, or invalid output shape triggers deterministic fallback.
- API responses still return a narrative object with a `source` field indicating provider origin.

---

## 8) API contract and schema strategy

Current strategy:

- Backend Pydantic models in `app/models/contracts.py` define request/response contracts.
- Frontend TypeScript types in `apps/web/src/types/recap.ts` mirror backend response shapes.
- Frontend API access is centralized in `apps/web/src/lib/api.ts`.

There is also `packages/shared-schema/` in the repo, but MVP contract sharing is currently not generated from a single canonical schema package yet.

Contributor guidance:

- Treat backend contracts as source of truth.
- Update frontend types and rendering code in the same change when contract fields change.
- Keep route-level response mapping explicit and test-covered.

---

## 9) Request lifecycle (recap generation)

`POST /api/v1/recaps/generate` high-level flow:

1. Validate request payload and authenticated session.
2. Refresh Strava tokens if needed.
3. Fetch and normalize activities.
4. Compute deterministic insight bundle.
5. Generate narrative via provider service (Ollama primary, deterministic fallback).
6. Return a single recap payload consumed directly by frontend sections.

This preserves a clear separation between provider IO, deterministic computation, and presentation.

---

## 10) Recap map rendering

The recap page includes an optional map section titled "Where this story happened" when the backend returns `mapData`.

Frontend approach:
- `apps/web` uses Leaflet/React Leaflet with OpenStreetMap tile URLs.
- Leaflet rendering is isolated in a client-only component to avoid Next.js SSR issues.
- Summary polylines render as route lines; activities without polylines can still render start/end markers.
- When geographic data is absent, the map section is hidden so the recap never shows a broken map container.

Testing and demo behavior:
- Tests pass mocked map payloads, including `isDemoData: true`, so map section behavior is covered without live Strava or external map tile access.
- Production recap generation does not synthesize demo routes into real user recaps.
