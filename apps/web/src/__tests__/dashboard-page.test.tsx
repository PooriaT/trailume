import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { ApiError, disconnectStrava, fetchActivities, getStravaAuthStatus } from "@/lib/api";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  return {
    ...actual,
    disconnectStrava: jest.fn(),
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

function selectDate(label: "Start date" | "End date", value: string) {
  const [year, month, day] = value.split("-");
  const monthLabel = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(undefined, {
    month: "short",
  });

  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}:`) }));
  fireEvent.change(screen.getByRole("combobox", { name: `${label} month` }), { target: { value: month } });
  fireEvent.change(screen.getByRole("combobox", { name: `${label} year` }), { target: { value: year } });
  fireEvent.click(screen.getByRole("button", { name: `${label} ${monthLabel} ${Number(day)}, ${year}` }));
}

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    (getStravaAuthStatus as jest.Mock).mockResolvedValue({ connected: true, athleteName: "Casey" });
    (disconnectStrava as jest.Mock).mockResolvedValue({
      connected: false,
      provider: "strava",
      message: "Disconnected from Strava",
    });
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("submits filter values to activity preview API", async () => {
    (fetchActivities as jest.Mock).mockResolvedValue({ activities: [], empty: true });

    renderPage();

    await screen.findByRole("button", { name: /^Start date:/ });
    selectDate("Start date", "2026-01-01");
    selectDate("End date", "2026-01-03");
    fireEvent.change(screen.getByLabelText("Activity type"), { target: { value: "running" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview activities" }));

    await waitFor(() => {
      const calls = (fetchActivities as jest.Mock).mock.calls;
      expect(calls.some(([arg]) =>
        arg?.startDate === "2026-01-01" &&
        arg?.endDate === "2026-01-03" &&
        arg?.activityType === "running",
      )).toBe(true);
    });
    expect(await screen.findByText("No activities match this date range or type.")).toBeInTheDocument();
  });

  it("shows API error from preview request", async () => {
    (fetchActivities as jest.Mock).mockRejectedValue(new ApiError("Auth required", 401));

    renderPage();
    await screen.findByRole("button", { name: "Preview activities" });
    fireEvent.click(screen.getByRole("button", { name: "Preview activities" }));

    expect(await screen.findByText("Auth required")).toBeInTheDocument();
  });

  it("navigates to recap route with query params", async () => {
    renderPage();

    await screen.findByRole("button", { name: /^Start date:/ });
    selectDate("Start date", "2026-01-10");
    selectDate("End date", "2026-01-12");
    fireEvent.change(screen.getByLabelText("Activity type"), { target: { value: "cycling" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate recap" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        "/recap?startDate=2026-01-10&endDate=2026-01-12&activityType=cycling",
      );
    });
  });

  it("disables generation and shows a clear error for an invalid date range", async () => {
    renderPage();

    await screen.findByRole("button", { name: /^Start date:/ });
    selectDate("Start date", "2026-01-10");
    selectDate("End date", "2026-01-09");

    expect(screen.getByRole("button", { name: "Generate recap" })).toBeDisabled();
    expect(screen.getByText("Start date must be on or before end date.")).toBeInTheDocument();
  });

  it("renders Strava connect as the primary orange CTA when disconnected", async () => {
    (getStravaAuthStatus as jest.Mock).mockResolvedValue({ connected: false, athleteName: null });

    renderPage();

    const connectButton = await screen.findByRole("button", { name: "Connect with Strava" });
    expect(connectButton).toHaveClass("btn-strava");
    expect(connectButton).toBeEnabled();
  });

  it("confirms disconnect, clears auth state, and returns to landing", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Disconnect from Strava" }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        "Disconnect from Strava? Trailume will clear your connection, filters, activity preview, and generated recap.",
      );
      expect(disconnectStrava).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith("/");
    });
    expect(window.sessionStorage.getItem("trailume:auth-message")).toBe("Disconnected from Strava");
  });

  it("keeps the current state when disconnect is cancelled", async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Disconnect from Strava" }));

    expect(disconnectStrava).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows a user-facing error when disconnect fails", async () => {
    (disconnectStrava as jest.Mock).mockRejectedValue(new ApiError("Could not disconnect", 500));

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Disconnect from Strava" }));

    expect(await screen.findByText("Could not disconnect")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
