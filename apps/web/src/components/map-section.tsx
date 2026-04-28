"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ComponentType } from "react";
import type { RecapMapActivity, RecapResponse, StandoutActivity } from "@/types/recap";

type MapCanvasProps = {
  activities: RecapMapActivity[];
  highlightedActivityIds: string[];
  selectedActivityId: string | null;
  privacyMode: boolean;
};

const DefaultMapCanvas = dynamic(
  () => import("@/components/activity-map-canvas").then((module) => module.ActivityMapCanvas),
  {
    ssr: false,
    loading: () => <div className="map-loading" aria-label="Loading activity map" />,
  },
) as ComponentType<MapCanvasProps>;

function formatDistance(distanceM: number) {
  return `${(distanceM / 1000).toFixed(1)} km`;
}

function formatActivityDate(startDate: string | null | undefined) {
  if (!startDate) {
    return "Date unavailable";
  }

  const [year, month, day] = startDate.split("T")[0].split("-").map(Number);
  if (!year || !month || !day) {
    return startDate;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatElevation(elevationGainM: number) {
  return elevationGainM > 0 ? `${Math.round(elevationGainM)} m gain` : "No gain recorded";
}

function formatActivityType(activityType: string) {
  return activityType
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function summarizeStandoutReason(reason: string) {
  const normalized = reason.toLowerCase();
  if (normalized.includes("longest")) {
    return "Longest activity";
  }
  if (normalized.includes("highest elevation") || normalized.includes("elevation gain")) {
    return "Highest elevation";
  }
  if (normalized.includes("fastest")) {
    return "Fastest effort";
  }
  return reason.replace(/\.$/, "");
}

function buildStandoutReasons(standoutActivities: StandoutActivity[]) {
  const byActivityId = new Map<string, string[]>();

  for (const activity of standoutActivities) {
    const reasons = byActivityId.get(activity.id) ?? [];
    const label = summarizeStandoutReason(activity.reason);
    if (!reasons.includes(label)) {
      reasons.push(label);
    }
    byActivityId.set(activity.id, reasons);
  }

  return byActivityId;
}

export function MapSection({
  recap,
  MapCanvas = DefaultMapCanvas,
}: {
  recap: RecapResponse;
  MapCanvas?: ComponentType<MapCanvasProps>;
}) {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(true);

  const activities = useMemo(
    () =>
      recap.mapData?.activities.filter(
        (activity) =>
          activity.summaryPolyline || activity.startCoordinate || activity.endCoordinate,
      ) ?? [],
    [recap.mapData?.activities],
  );

  const standoutReasonsByActivityId = useMemo(
    () => buildStandoutReasons(recap.standoutActivities),
    [recap.standoutActivities],
  );

  if (!activities.length) {
    return null;
  }
  const highlightedActivityIds = activities
    .filter((activity) => standoutReasonsByActivityId.has(activity.id))
    .map((activity) => activity.id);
  const routeCount = activities.filter((activity) => activity.summaryPolyline).length;
  const markerFallbackCount = activities.filter(
    (activity) =>
      !activity.summaryPolyline && (activity.startCoordinate || activity.endCoordinate),
  ).length;
  const standoutRouteCount = highlightedActivityIds.length;

  return (
    <section className="panel recap-section" aria-labelledby="activity-map-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Activity map</p>
          <h2 id="activity-map-heading">Where this story happened</h2>
        </div>
        {recap.mapData?.isDemoData ? <span className="demo-badge">Demo data</span> : null}
      </div>

      <div className="map-stat-grid" aria-label="Map summary">
        <article className="map-stat-card">
          <p className="map-stat-value">{activities.length}</p>
          <p className="muted">Mapped activities</p>
        </article>
        <article className="map-stat-card">
          <p className="map-stat-value">{routeCount}</p>
          <p className="muted">Route lines available</p>
        </article>
        <article className="map-stat-card">
          <p className="map-stat-value">{markerFallbackCount}</p>
          <p className="muted">Marker fallbacks</p>
        </article>
        <article className="map-stat-card">
          <p className="map-stat-value">{standoutRouteCount}</p>
          <p className="muted">Standout routes</p>
        </article>
      </div>

      <div className="map-controls-row">
        <button
          className={`map-filter-button ${selectedActivityId === null ? "is-active" : ""}`}
          type="button"
          onClick={() => setSelectedActivityId(null)}
          aria-pressed={selectedActivityId === null}
        >
          Show all
        </button>
        <label className="map-privacy-toggle">
          <input
            type="checkbox"
            checked={privacyMode}
            onChange={(event) => setPrivacyMode(event.target.checked)}
          />
          Privacy mode
        </label>
      </div>
      <p className="helper-text">
        Privacy mode reduces exposure of exact start and end locations by hiding endpoint markers
        and trimming route lines when possible.
      </p>

      <div className="map-experience-grid">
        <div className="map-shell">
          <MapCanvas
            activities={activities}
            highlightedActivityIds={highlightedActivityIds}
            selectedActivityId={selectedActivityId}
            privacyMode={privacyMode}
          />
        </div>
        <div className="map-activity-list" aria-label="Mapped activities">
          {activities.map((activity) => {
            const standoutReasons = standoutReasonsByActivityId.get(activity.id) ?? [];
            const isSelected = selectedActivityId === activity.id;

            return (
              <button
                className={`map-activity-item ${isSelected ? "is-selected" : ""} ${
                  standoutReasons.length ? "is-standout" : ""
                }`}
                key={activity.id}
                type="button"
                onClick={() => setSelectedActivityId(activity.id)}
                aria-pressed={isSelected}
              >
                <span className="map-activity-name">{activity.name}</span>
                <span className="map-activity-date">{formatActivityDate(activity.startDate)}</span>
                <span className="muted">
                  {formatActivityType(activity.activityType)} - {formatDistance(activity.distanceM)}
                  {" - "}
                  {formatElevation(activity.elevationGainM)}
                </span>
                {standoutReasons.length ? (
                  <span className="map-standout-reasons">{standoutReasons.join(" + ")}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <p className="muted">
        {routeCount > 0
          ? `${routeCount} route ${routeCount === 1 ? "line" : "lines"} shown from available activity geometry.`
          : "Route lines are not available, so start and end points are shown instead."}
      </p>
    </section>
  );
}
