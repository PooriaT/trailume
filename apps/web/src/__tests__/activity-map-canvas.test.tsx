import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ActivityMapCanvas } from "@/components/activity-map-canvas";

jest.mock("@/lib/map-polyline", () => ({
  decodePolyline: () => [
    [49, -123],
    [49.1, -123.1],
    [49.2, -123.2],
    [49.3, -123.3],
    [49.4, -123.4],
  ],
}));

jest.mock("react-leaflet", () => {
  const React = require("react");
  const map = { fitBounds: jest.fn(), setView: jest.fn() };

  return {
    MapContainer: ({ children }: { children: ReactNode }) =>
      React.createElement("div", { "data-testid": "leaflet-map" }, children),
    TileLayer: () => React.createElement("div", { "data-testid": "tile-layer" }),
    Polyline: ({
      children,
      positions,
      pathOptions,
    }: {
      children: ReactNode;
      positions: unknown[];
      pathOptions: { weight?: number; opacity?: number; dashArray?: string };
    }) =>
      React.createElement(
        "div",
        {
          "data-dash-array": pathOptions.dashArray ?? "",
          "data-opacity": String(pathOptions.opacity ?? ""),
          "data-positions": JSON.stringify(positions),
          "data-testid": "route-line",
          "data-weight": String(pathOptions.weight ?? ""),
        },
        children,
      ),
    CircleMarker: ({ children }: { children: ReactNode }) =>
      React.createElement("div", { "data-testid": "endpoint-marker" }, children),
    Tooltip: ({ children }: { children: ReactNode }) =>
      React.createElement("span", null, children),
    useMap: () => map,
  };
});

describe("ActivityMapCanvas", () => {
  const activity = {
    id: "1",
    name: "Privacy Route",
    activityType: "cycling",
    distanceM: 12000,
    elevationGainM: 140,
    startCoordinate: { lat: 49, lng: -123 },
    endCoordinate: { lat: 49.4, lng: -123.4 },
    summaryPolyline: "encoded-route",
  };

  it("hides endpoint marker labels and trims route positions in privacy mode", () => {
    render(
      <ActivityMapCanvas
        activities={[activity]}
        highlightedActivityIds={["1"]}
        selectedActivityId={null}
        privacyMode={true}
      />,
    );

    expect(screen.queryByText("Privacy Route start")).not.toBeInTheDocument();
    expect(screen.queryByText("Privacy Route end")).not.toBeInTheDocument();
    expect(screen.queryByTestId("endpoint-marker")).not.toBeInTheDocument();
    expect(screen.getByTestId("route-line")).toHaveAttribute(
      "data-positions",
      JSON.stringify([
        [49.1, -123.1],
        [49.2, -123.2],
        [49.3, -123.3],
      ]),
    );
    expect(screen.getByTestId("route-line")).toHaveAttribute("data-dash-array", "8 6");
  });

  it("de-emphasizes non-selected routes when a selected activity is provided", () => {
    render(
      <ActivityMapCanvas
        activities={[
          activity,
          {
            ...activity,
            id: "2",
            name: "Selected Route",
          },
        ]}
        highlightedActivityIds={["1"]}
        selectedActivityId="2"
        privacyMode={false}
      />,
    );

    const routeLines = screen.getAllByTestId("route-line");
    expect(routeLines[0]).toHaveAttribute("data-opacity", "0.24");
    expect(routeLines[1]).toHaveAttribute("data-weight", "7");
  });
});
