import { RecapFormValues, RecapResponse, StravaActivitiesResponse, StravaAuthStatus } from "@/types/recap";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function getStravaLoginUrl() {
  return `${API_BASE_URL}/api/v1/auth/strava/login`;
}

export async function getStravaAuthStatus() {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/strava/status`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to read Strava auth state.");
  }
  return (await res.json()) as StravaAuthStatus;
}

export async function fetchActivities(payload: RecapFormValues) {
  const params = new URLSearchParams({
    start: new Date(`${payload.startDate}T00:00:00Z`).toISOString(),
    end: new Date(`${payload.endDate}T23:59:59Z`).toISOString(),
    type: payload.activityType,
  });

  const res = await fetch(`${API_BASE_URL}/api/v1/activities?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to fetch activities.");
  }
  return (await res.json()) as StravaActivitiesResponse;
}

export async function generateRecap(payload: RecapFormValues) {
  const res = await fetch(`${API_BASE_URL}/api/v1/recaps/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to generate recap.");
  }
  return (await res.json()) as RecapResponse;
}
