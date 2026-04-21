import { ApiError, fetchActivities } from "@/lib/api";

describe("api client", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds expected activities query parameters", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ activities: [], empty: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await fetchActivities({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      activityType: "running",
    });

    const calledUrl = String(fetchSpy.mock.calls[0][0]);
    expect(calledUrl).toContain("/api/v1/activities?");
    expect(calledUrl).toContain("type=running");
    expect(calledUrl).toContain("start=2026-01-01T00%3A00%3A00.000Z");
    expect(calledUrl).toContain("end=2026-01-31T23%3A59%3A59.000Z");
  });

  it("raises ApiError with backend detail message", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Strava auth required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      fetchActivities({ startDate: "2026-01-01", endDate: "2026-01-31", activityType: "all" }),
    ).rejects.toEqual(expect.objectContaining<ApiError>({ message: "Strava auth required", status: 401 }));
  });
});
