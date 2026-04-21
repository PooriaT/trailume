import { ApiError, fetchActivities } from "@/lib/api";

type MockResponseShape = {
  ok: boolean;
  status: number;
  json: jest.Mock;
  text: jest.Mock;
};

function mockJsonResponse(payload: unknown, status = 200): MockResponseShape {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(payload),
    text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
  };
}

describe("api client", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds expected activities query parameters", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(mockJsonResponse({ activities: [], empty: true }) as unknown as Response);

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
      mockJsonResponse({ detail: "Strava auth required" }, 401) as unknown as Response,
    );

    await expect(
      fetchActivities({ startDate: "2026-01-01", endDate: "2026-01-31", activityType: "all" }),
    ).rejects.toEqual(
      expect.objectContaining<ApiError>({ message: "Strava auth required", status: 401 }),
    );
  });
});
