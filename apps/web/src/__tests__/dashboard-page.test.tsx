import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { ApiError, fetchActivities, getStravaAuthStatus } from "@/lib/api";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  return {
    ...actual,
    fetchActivities: jest.fn(),
    getStravaAuthStatus: jest.fn(),
  };
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getStravaAuthStatus as jest.Mock).mockResolvedValue({ connected: true, athleteName: "Casey" });
  });

  it("submits filter values to activity preview API", async () => {
    (fetchActivities as jest.Mock).mockResolvedValue({ activities: [], empty: true });

    renderPage();

    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-01-03" } });
    fireEvent.change(screen.getByLabelText("Activity type"), { target: { value: "running" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview activities" }));

    await waitFor(() => {
      expect(fetchActivities).toHaveBeenLastCalledWith({
        startDate: "2026-01-01",
        endDate: "2026-01-03",
        activityType: "running",
      });
    });
    expect(await screen.findByText("No activities match this date range or type.")).toBeInTheDocument();
  });

  it("shows API error from preview request", async () => {
    (fetchActivities as jest.Mock).mockRejectedValue(new ApiError("Auth required", 401));

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Preview activities" }));

    expect(await screen.findByText("Auth required")).toBeInTheDocument();
  });

  it("navigates to recap route with query params", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-01-10" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-01-12" } });
    fireEvent.change(screen.getByLabelText("Activity type"), { target: { value: "cycling" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate recap" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        "/recap?startDate=2026-01-10&endDate=2026-01-12&activityType=cycling",
      );
    });
  });
});
