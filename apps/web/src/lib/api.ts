import {
  RecapFormValues,
  RecapResponse,
  StravaActivitiesResponse,
  StravaAuthStatus,
  StravaDisconnectResponse,
} from "@/types/recap";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getStravaLoginUrl(returnTo?: string) {
  const params = returnTo ? `?${new URLSearchParams({ return_to: returnTo }).toString()}` : "";
  return `${API_BASE_URL}/api/v1/auth/strava/login${params}`;
}

async function parseErrorResponse(res: Response, fallbackMessage: string): Promise<ApiError> {
  let detail: string | undefined;
  let code: string | undefined;

  try {
    const payload = (await res.json()) as { detail?: string | { message?: string; code?: string } };
    if (typeof payload?.detail === "string") {
      detail = payload.detail;
    } else {
      detail = payload?.detail?.message;
      code = payload?.detail?.code;
    }
  } catch {
    try {
      const text = await res.text();
      detail = text || undefined;
    } catch {
      detail = undefined;
    }
  }

  return new ApiError(detail ?? fallbackMessage, res.status, detail, code);
}

async function apiFetch<T>(input: string, init: RequestInit, fallbackMessage: string): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw await parseErrorResponse(response, fallbackMessage);
  }
  return (await response.json()) as T;
}

export async function getStravaAuthStatus() {
  return apiFetch<StravaAuthStatus>(
    `${API_BASE_URL}/api/v1/auth/strava/status`,
    { credentials: "include" },
    "Failed to read Strava auth state.",
  );
}

export async function disconnectStrava() {
  return apiFetch<StravaDisconnectResponse>(
    `${API_BASE_URL}/api/v1/auth/strava/disconnect`,
    {
      method: "POST",
      credentials: "include",
    },
    "Failed to disconnect from Strava.",
  );
}

export async function fetchActivities(payload: RecapFormValues) {
  const params = new URLSearchParams({
    start: new Date(`${payload.startDate}T00:00:00Z`).toISOString(),
    end: new Date(`${payload.endDate}T23:59:59Z`).toISOString(),
    type: payload.activityType,
  });

  return apiFetch<StravaActivitiesResponse>(
    `${API_BASE_URL}/api/v1/activities?${params.toString()}`,
    { credentials: "include" },
    "Failed to fetch activities.",
  );
}

export async function generateRecap(payload: RecapFormValues) {
  return apiFetch<RecapResponse>(
    `${API_BASE_URL}/api/v1/recaps/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    },
    "Failed to generate recap.",
  );
}
