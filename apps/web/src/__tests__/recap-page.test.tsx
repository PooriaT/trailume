import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import RecapPage from "@/app/recap/page";
import { ApiError, generateRecap } from "@/lib/api";

jest.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams({
      startDate: "2026-01-01",
      endDate: "2026-01-07",
      activityType: "cycling",
    }),
}));

jest.mock("@/components/hero-recap-section", () => ({ HeroRecapSection: () => <div>Hero section</div> }));
jest.mock("@/components/stat-cards-section", () => ({ StatCardsSection: () => <div>Stat cards</div> }));
jest.mock("@/components/highlight-cards-section", () => ({ HighlightCardsSection: () => <div>Highlights</div> }));
jest.mock("@/components/standout-activity-cards-section", () => ({ StandoutActivityCardsSection: () => <div>Standout</div> }));
jest.mock("@/components/trend-chart-section", () => ({ TrendChartSection: () => <div>Trend chart</div> }));
jest.mock("@/components/narrative-text-section", () => ({ NarrativeTextSection: () => <div>Narrative text</div> }));
jest.mock("@/components/map-section", () => ({ MapSection: () => <div>Map section</div> }));

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  return {
    ...actual,
    generateRecap: jest.fn(),
  };
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <RecapPage />
    </QueryClientProvider>,
  );
}

const recapResponse = {
  title: "Your Cycling Recap",
  narrative: {
    title: "Your Cycling Recap",
    summary: "Summary",
    highlights: ["h1", "h2", "h3"],
    reflection: "Reflection",
    source: "fallback" as const,
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
    frequencyTrend: "flat" as const,
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

describe("RecapPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading then renders recap sections", async () => {
    (generateRecap as jest.Mock).mockResolvedValue(recapResponse);

    renderPage();

    expect(screen.getByText("Building your recap")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Hero section")).toBeInTheDocument();
    });
    expect(screen.getByText("Narrative text")).toBeInTheDocument();
    expect(generateRecap).toHaveBeenCalledWith({
      startDate: "2026-01-01",
      endDate: "2026-01-07",
      activityType: "cycling",
    });
  });

  it("shows actionable error state when recap request fails", async () => {
    (generateRecap as jest.Mock).mockRejectedValue(new ApiError("Token expired", 401));

    renderPage();

    expect(await screen.findByText("Couldn’t generate this recap")).toBeInTheDocument();
    expect(screen.getByText("Token expired")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to filters" })).toHaveAttribute("href", "/dashboard");
  });
});
