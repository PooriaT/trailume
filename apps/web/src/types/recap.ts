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

export interface HighlightCard {
  id: string;
  title: string;
  value: string;
  detail: string;
}

export interface StandoutActivity {
  id: string;
  name: string;
  reason: string;
  distanceKm: number;
  elevationM: number;
  movingTimeS?: number | null;
}

export interface ActivityTypeTotals {
  activityCount: number;
  distanceM: number;
  movingTimeS: number;
  elapsedTimeS: number;
  elevationGainM: number;
}

export interface SummaryMetrics {
  activityCount: number;
  totalDistanceM: number;
  totalMovingTimeS?: number | null;
  totalElapsedTimeS?: number | null;
  totalElevationGainM?: number | null;
  averageDistanceM: number;
  averageMovingTimeS?: number | null;
  averageSpeedMps?: number | null;
  totalsByActivityType: Record<string, ActivityTypeTotals>;
}

export interface TrendPoint {
  bucketStart: string;
  bucketType: "day" | "week";
  activityCount: number;
  distanceKm: number;
}

export interface InsightFlags {
  hasFastestEffort: boolean;
  hasStrongFinish: boolean;
  hasSlowStart: boolean;
  frequencyTrend: "increasing" | "decreasing" | "flat";
  hasRepeatedRouteTendency: boolean;
  repeatedRouteName?: string | null;
}

export interface RecapMetadata {
  selectedActivityType: string;
  startDate: string;
  endDate: string;
  rangeDays: number;
  hasElapsedTimeCoverage: boolean;
  hasMovingTimeCoverage: boolean;
  availableActivityTypes: string[];
  mostActiveDay?: {
    date: string;
    activityCount: number;
    distanceM: number;
  } | null;
}

export interface RecapNarrative {
  title: string;
  summary: string;
  highlights: string[];
  reflection: string;
  source: "ollama" | "fallback";
}

export interface RecapResponse {
  title: string;
  narrative: RecapNarrative;
  summaryMetrics: SummaryMetrics;
  keyMetrics: KeyMetric[];
  highlightCards: HighlightCard[];
  chartPoints: { date: string; distanceKm: number; activityCount: number }[];
  trendSeries: TrendPoint[];
  standoutActivities: StandoutActivity[];
  insightFlags: InsightFlags;
  metadata: RecapMetadata;
}

export interface StravaAuthStatus {
  connected: boolean;
  provider: "strava";
  athleteName?: string | null;
  activityAccess: "missing" | "standard" | "private";
  permissions: {
    hasProfileRead: boolean;
    hasActivityRead: boolean;
    hasPrivateActivityRead: boolean;
  };
}

export interface StravaDisconnectResponse {
  connected: false;
  provider: "strava";
  message: string;
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
