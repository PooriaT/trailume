"use client";

import { Fragment, useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { RecapMapActivity, MapCoordinate } from "@/types/recap";
import { decodePolyline } from "@/lib/map-polyline";

const ROUTE_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#0891b2"];

function privacyTrimRoute(route: LatLngExpression[]) {
  if (route.length <= 3) {
    return route;
  }

  const trimCount = Math.max(1, Math.min(10, Math.floor(route.length * 0.05)));
  if (route.length - trimCount * 2 < 2) {
    return route.slice(1, -1);
  }

  return route.slice(trimCount, route.length - trimCount);
}

function isValidCoordinate(point: MapCoordinate | null | undefined): point is MapCoordinate {
  return (
    typeof point?.lat === "number" &&
    typeof point?.lng === "number" &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

function toLatLng(point: MapCoordinate): LatLngExpression {
  return [point.lat, point.lng];
}

function FitMapToPoints({ points }: { points: LatLngExpression[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(points as LatLngBoundsExpression, { padding: [28, 28] });
  }, [map, points]);

  return null;
}

export function ActivityMapCanvas({
  activities,
  highlightedActivityIds,
  selectedActivityId,
  privacyMode,
}: {
  activities: RecapMapActivity[];
  highlightedActivityIds: string[];
  selectedActivityId: string | null;
  privacyMode: boolean;
}) {
  const highlightedActivityIdSet = useMemo(
    () => new Set(highlightedActivityIds),
    [highlightedActivityIds],
  );

  const routeData = useMemo(
    () =>
      activities.map((activity, index) => {
        const route = decodePolyline(activity.summaryPolyline);
        const renderedRoute = privacyMode ? privacyTrimRoute(route) : route;
        const start = isValidCoordinate(activity.startCoordinate)
          ? toLatLng(activity.startCoordinate)
          : route[0];
        const end = isValidCoordinate(activity.endCoordinate)
          ? toLatLng(activity.endCoordinate)
          : route[route.length - 1];

        return {
          activity,
          color: ROUTE_COLORS[index % ROUTE_COLORS.length],
          route,
          renderedRoute,
          start,
          end,
        };
      }),
    [activities, privacyMode],
  );

  const allPoints = routeData.flatMap((item) => {
    const markerPoints = privacyMode
      ? []
      : ([item.start, item.end].filter(Boolean) as LatLngExpression[]);
    return item.renderedRoute.length > 1 ? item.renderedRoute : markerPoints;
  });

  if (!allPoints.length) {
    return (
      <div className="map-empty-state">
        <p className="muted">
          {privacyMode
            ? "Privacy mode is hiding endpoint-only map data for this recap."
            : "Map data was present, but no valid coordinates could be rendered."}
        </p>
      </div>
    );
  }

  const hasSelectedActivity = selectedActivityId !== null;
  const orderedRouteData = [...routeData].sort((left, right) => {
    if (left.activity.id === selectedActivityId) {
      return 1;
    }
    if (right.activity.id === selectedActivityId) {
      return -1;
    }
    return 0;
  });

  return (
    <MapContainer className="activity-map" center={allPoints[0]} zoom={12} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitMapToPoints points={allPoints} />
      {orderedRouteData.map((item) => {
        const isSelected = selectedActivityId === item.activity.id;
        const isStandout = highlightedActivityIdSet.has(item.activity.id);
        const isDimmed = hasSelectedActivity && !isSelected;
        const routeWeight = isSelected ? 7 : isStandout ? 6 : 4;
        const routeOpacity = isDimmed ? 0.24 : isStandout || isSelected ? 0.95 : 0.7;
        const markerRadius = isSelected ? 8 : isStandout ? 7 : 6;

        return (
          <Fragment key={item.activity.id}>
            {item.renderedRoute.length > 1 ? (
              <Polyline
                positions={item.renderedRoute}
                pathOptions={{
                  color: item.color,
                  weight: routeWeight,
                  opacity: routeOpacity,
                  dashArray: isStandout && !isSelected ? "8 6" : undefined,
                }}
              >
                <Tooltip>{item.activity.name}</Tooltip>
              </Polyline>
            ) : null}
            {!privacyMode && item.start ? (
              <CircleMarker
                center={item.start}
                pathOptions={{
                  color: item.color,
                  fillColor: "#ffffff",
                  fillOpacity: isDimmed ? 0.45 : 1,
                  opacity: isDimmed ? 0.35 : 1,
                }}
                radius={markerRadius}
              >
                <Tooltip>{item.activity.name} start</Tooltip>
              </CircleMarker>
            ) : null}
            {!privacyMode && item.end ? (
              <CircleMarker
                center={item.end}
                pathOptions={{
                  color: item.color,
                  fillColor: item.color,
                  fillOpacity: isDimmed ? 0.4 : 0.9,
                  opacity: isDimmed ? 0.35 : 1,
                }}
                radius={markerRadius}
              >
                <Tooltip>{item.activity.name} end</Tooltip>
              </CircleMarker>
            ) : null}
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
