"use client";

import { Fragment, useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { RecapMapActivity, MapCoordinate } from "@/types/recap";
import { decodePolyline } from "@/lib/map-polyline";

const ROUTE_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#0891b2"];

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

export function ActivityMapCanvas({ activities }: { activities: RecapMapActivity[] }) {
  const routeData = useMemo(
    () =>
      activities.map((activity, index) => {
        const route = decodePolyline(activity.summaryPolyline);
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
          start,
          end,
        };
      }),
    [activities],
  );

  const allPoints = routeData.flatMap((item) => {
    const markerPoints = [item.start, item.end].filter(Boolean) as LatLngExpression[];
    return item.route.length > 1 ? item.route : markerPoints;
  });

  if (!allPoints.length) {
    return (
      <div className="map-empty-state">
        <p className="muted">Map data was present, but no valid coordinates could be rendered.</p>
      </div>
    );
  }

  return (
    <MapContainer className="activity-map" center={allPoints[0]} zoom={12} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitMapToPoints points={allPoints} />
      {routeData.map((item) => (
        <Fragment key={item.activity.id}>
          {item.route.length > 1 ? (
            <Polyline positions={item.route} pathOptions={{ color: item.color, weight: 4 }} />
          ) : null}
          {item.start ? (
            <CircleMarker
              center={item.start}
              pathOptions={{ color: item.color, fillColor: "#ffffff", fillOpacity: 1 }}
              radius={6}
            >
              <Tooltip>{item.activity.name} start</Tooltip>
            </CircleMarker>
          ) : null}
          {item.end ? (
            <CircleMarker
              center={item.end}
              pathOptions={{ color: item.color, fillColor: item.color, fillOpacity: 0.9 }}
              radius={6}
            >
              <Tooltip>{item.activity.name} end</Tooltip>
            </CircleMarker>
          ) : null}
        </Fragment>
      ))}
    </MapContainer>
  );
}
