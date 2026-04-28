import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapSection } from "@/components/map-section";
import type { RecapMapActivity, RecapResponse } from "@/types/recap";

function StubMapCanvas({
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
  return (
    <div data-testid="map-canvas">
      {activities.length} mapped activities; selected:{selectedActivityId ?? "all"}; privacy:
      {privacyMode ? "on" : "off"}; standout:{highlightedActivityIds.join(",") || "none"}
    </div>
  );
}

const baseRecap: RecapResponse = {
  title: "Your Cycling Recap",
  narrative: {
    title: "Your Cycling Recap",
    summary: "Summary",
    highlights: ["h1", "h2", "h3"],
    reflection: "Reflection",
    source: "fallback",
  },
  summaryMetrics: {
    activityCount: 1,
    totalDistanceM: 10000,
    averageDistanceM: 10000,
    totalsByActivityType: {},
  },
  keyMetrics: [],
  highlightCards: [],
  chartPoints: [],
  trendSeries: [],
  standoutActivities: [],
  insightFlags: {
    hasFastestEffort: false,
    hasStrongFinish: false,
    hasSlowStart: false,
    frequencyTrend: "flat",
    hasRepeatedRouteTendency: false,
    repeatedRouteName: null,
  },
  metadata: {
    selectedActivityType: "cycling",
    startDate: "2026-01-01",
    endDate: "2026-01-07",
    rangeDays: 7,
    hasElapsedTimeCoverage: false,
    hasMovingTimeCoverage: false,
    availableActivityTypes: [],
    mostActiveDay: null,
  },
};

describe("MapSection", () => {
  it("renders when map data exists", () => {
    render(
      <MapSection
        recap={{
          ...baseRecap,
          mapData: {
            isDemoData: false,
            activities: [
              {
                id: "1",
                name: "Seawall Ride",
                activityType: "cycling",
                distanceM: 12300,
                elevationGainM: 80,
                startCoordinate: { lat: 49.2827, lng: -123.1207 },
                endCoordinate: { lat: 49.29, lng: -123.11 },
                summaryPolyline: "abc123",
              },
            ],
          },
        }}
        MapCanvas={StubMapCanvas}
      />,
    );

    expect(screen.getByRole("heading", { name: "Where this story happened" })).toBeInTheDocument();
    expect(screen.getByTestId("map-canvas")).toHaveTextContent("1 mapped activities");
    expect(screen.getByTestId("map-canvas")).toHaveTextContent("privacy:on");
    expect(screen.getByText("Seawall Ride")).toBeInTheDocument();
    expect(screen.getByText("Mapped activities")).toBeInTheDocument();
    expect(screen.getByText("Route lines available")).toBeInTheDocument();
    expect(screen.getByText("Marker fallbacks")).toBeInTheDocument();
    expect(screen.getByText("Standout routes")).toBeInTheDocument();
    expect(screen.getByText("1 route line shown from available activity geometry.")).toBeInTheDocument();
  });

  it("hides when map data is missing", () => {
    const { container } = render(<MapSection recap={baseRecap} MapCanvas={StubMapCanvas} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows marker fallback text when only coordinates are available", () => {
    render(
      <MapSection
        recap={{
          ...baseRecap,
          mapData: {
            isDemoData: true,
            activities: [
              {
                id: "1",
                name: "Demo Point-to-Point Run",
                activityType: "running",
                distanceM: 5000,
                elevationGainM: 20,
                startCoordinate: { lat: 49.2827, lng: -123.1207 },
                endCoordinate: { lat: 49.29, lng: -123.11 },
              },
            ],
          },
        }}
        MapCanvas={StubMapCanvas}
      />,
    );

    expect(screen.getByText("Demo data")).toBeInTheDocument();
    expect(
      screen.getByText("Route lines are not available, so start and end points are shown instead."),
    ).toBeInTheDocument();
  });

  it("shows standout reasons together for mapped standout activities", () => {
    render(
      <MapSection
        recap={{
          ...baseRecap,
          standoutActivities: [
            {
              id: "1",
              name: "Seawall Ride",
              reason: "Longest activity in the selected range.",
              distanceKm: 12.3,
              elevationM: 80,
            },
            {
              id: "1",
              name: "Seawall Ride",
              reason: "Fastest effort by average moving speed (distance / moving time).",
              distanceKm: 12.3,
              elevationM: 80,
            },
          ],
          mapData: {
            isDemoData: false,
            activities: [
              {
                id: "1",
                name: "Seawall Ride",
                activityType: "cycling",
                distanceM: 12300,
                elevationGainM: 80,
                summaryPolyline: "abc123",
              },
            ],
          },
        }}
        MapCanvas={StubMapCanvas}
      />,
    );

    expect(screen.getByText("Longest activity + Fastest effort")).toBeInTheDocument();
    expect(screen.getByTestId("map-canvas")).toHaveTextContent("standout:1");
  });

  it("lets the user focus an activity and return to all routes", async () => {
    const user = userEvent.setup();

    render(
      <MapSection
        recap={{
          ...baseRecap,
          mapData: {
            isDemoData: false,
            activities: [
              {
                id: "1",
                name: "Seawall Ride",
                activityType: "cycling",
                distanceM: 12300,
                elevationGainM: 80,
                summaryPolyline: "abc123",
              },
              {
                id: "2",
                name: "Hill Repeats",
                activityType: "running",
                distanceM: 7000,
                elevationGainM: 320,
                summaryPolyline: "def456",
              },
            ],
          },
        }}
        MapCanvas={StubMapCanvas}
      />,
    );

    expect(screen.getByTestId("map-canvas")).toHaveTextContent("selected:all");

    await user.click(screen.getByRole("button", { name: /Hill Repeats/i }));
    expect(screen.getByTestId("map-canvas")).toHaveTextContent("selected:2");

    await user.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.getByTestId("map-canvas")).toHaveTextContent("selected:all");
  });

  it("toggles privacy mode for the map rendering layer", async () => {
    const user = userEvent.setup();

    render(
      <MapSection
        recap={{
          ...baseRecap,
          mapData: {
            isDemoData: false,
            activities: [
              {
                id: "1",
                name: "Seawall Ride",
                activityType: "cycling",
                distanceM: 12300,
                elevationGainM: 80,
                summaryPolyline: "abc123",
              },
            ],
          },
        }}
        MapCanvas={StubMapCanvas}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Privacy mode" })).toBeChecked();
    expect(screen.getByText(/reduces exposure of exact start and end locations/i)).toBeInTheDocument();
    expect(screen.getByTestId("map-canvas")).toHaveTextContent("privacy:on");

    await user.click(screen.getByRole("checkbox", { name: "Privacy mode" }));
    expect(screen.getByTestId("map-canvas")).toHaveTextContent("privacy:off");
  });
});
