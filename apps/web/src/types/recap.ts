export type ActivityType = "all" | "cycling" | "running" | "swimming";

export interface RecapFormValues {
  startDate: string;
  endDate: string;
  activityType: ActivityType;
}

export interface KeyMetric {
  label: string;
  value: string;
}

export interface StandoutActivity {
  id: string;
  name: string;
  reason: string;
  distanceKm: number;
  elevationM: number;
}

export interface RecapResponse {
  title: string;
  narrativeSummary: string;
  narrativeSource: "ollama" | "fallback";
  keyMetrics: KeyMetric[];
  chartPoints: { date: string; distanceKm: number }[];
  standoutActivities: StandoutActivity[];
}

export interface StravaAuthStatus {
  connected: boolean;
  provider: "strava";
  athleteName?: string | null;
}

export interface StravaActivity {
  id: string;
  name: string;
  activityType: string;
  startTime: string;
  distanceM: number;
  elevationGainM: number;
}

export interface StravaActivitiesResponse {
  activities: StravaActivity[];
  empty: boolean;
  message?: string;
}
