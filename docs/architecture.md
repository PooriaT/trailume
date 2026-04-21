# Architecture Notes

- Frontend: Next.js App Router, React Query data fetching, typed API client wrappers.
- Backend: FastAPI with separated modules:
  - `services/strava` for provider integration
  - `services/analytics` for deterministic metrics
  - `services/narrative` for LLM/fallback narration
- Narrative layer only consumes structured `InsightBundle` output.
