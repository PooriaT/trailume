export type AuthState =
  | "not-connected"
  | "connecting"
  | "connected-standard"
  | "connected-private"
  | "missing-activity-access"
  | "error";

type AuthStateInput = {
  connected?: boolean;
  activityAccess?: "missing" | "standard" | "private";
  isLoading: boolean;
  isError: boolean;
  isTransitioning?: boolean;
};

// Auth state is derived from the Strava status endpoint plus local transition flags.
// Disconnect returns the app to "not-connected" by clearing cached auth, recap, and activity state.
export function getAuthState({
  connected,
  activityAccess,
  isLoading,
  isError,
  isTransitioning = false,
}: AuthStateInput): AuthState {
  if (isTransitioning || isLoading) {
    return "connecting";
  }

  if (isError) {
    return "error";
  }

  if (!connected) {
    return "not-connected";
  }

  if (activityAccess === "private") {
    return "connected-private";
  }

  if (activityAccess === "standard") {
    return "connected-standard";
  }

  return "missing-activity-access";
}
