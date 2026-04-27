"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { RecapMapActivity, RecapResponse } from "@/types/recap";

type MapCanvasProps = {
  activities: RecapMapActivity[];
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

export function MapSection({
  recap,
  MapCanvas = DefaultMapCanvas,
}: {
  recap: RecapResponse;
  MapCanvas?: ComponentType<MapCanvasProps>;
}) {
  const activities = recap.mapData?.activities.filter(
    (activity) =>
      activity.summaryPolyline || activity.startCoordinate || activity.endCoordinate,
  );

  if (!activities?.length) {
    return null;
  }

  const routeCount = activities.filter((activity) => activity.summaryPolyline).length;

  return (
    <section className="panel recap-section" aria-labelledby="activity-map-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Activity map</p>
          <h2 id="activity-map-heading">Where this story happened</h2>
        </div>
        {recap.mapData?.isDemoData ? <span className="demo-badge">Demo data</span> : null}
      </div>
      <div className="map-shell">
        <MapCanvas activities={activities} />
      </div>
      <div className="map-summary-grid">
        {activities.slice(0, 4).map((activity) => (
          <article className="map-activity-card" key={activity.id}>
            <p className="map-activity-name">{activity.name}</p>
            <p className="muted">
              {activity.activityType} - {formatDistance(activity.distanceM)}
              {activity.elevationGainM > 0 ? ` - ${Math.round(activity.elevationGainM)} m gain` : ""}
            </p>
          </article>
        ))}
      </div>
      <p className="muted">
        {routeCount > 0
          ? `${routeCount} route ${routeCount === 1 ? "line" : "lines"} shown from available activity geometry.`
          : "Route lines are not available, so start and end points are shown instead."}
      </p>
    </section>
  );
}
