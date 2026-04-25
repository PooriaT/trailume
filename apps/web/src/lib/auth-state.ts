export type AuthState = "not-connected" | "connecting" | "connected" | "error";

type AuthStateInput = {
  connected?: boolean;
  isLoading: boolean;
  isError: boolean;
  isTransitioning?: boolean;
};

// Auth state is derived from the Strava status endpoint plus local transition flags.
// Disconnect returns the app to "not-connected" by clearing cached auth, recap, and activity state.
export function getAuthState({
  connected,
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

  return connected ? "connected" : "not-connected";
}
