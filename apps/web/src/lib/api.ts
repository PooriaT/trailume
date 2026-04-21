import { RecapFormValues, RecapResponse } from "@/types/recap";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function getStravaStartUrl() {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/strava/start`, { method: "POST" });
  if (!res.ok) {
    throw new Error("Failed to initialize Strava auth.");
  }
  return (await res.json()) as { authorizationUrl: string };
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
