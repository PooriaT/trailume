import { getDefaultRecapFilters, validateRecapDateRange } from "@/lib/date-filters";

describe("date filter utilities", () => {
  it("sets default start date to one year before today", () => {
    expect(getDefaultRecapFilters(new Date(2026, 3, 26)).startDate).toBe("2025-04-26");
  });

  it("sets default end date to today", () => {
    expect(getDefaultRecapFilters(new Date(2026, 3, 26)).endDate).toBe("2026-04-26");
  });

  it("reports an invalid date range when start date is after end date", () => {
    expect(validateRecapDateRange({ startDate: "2026-04-27", endDate: "2026-04-26" })).toEqual({
      isValid: false,
      message: "Start date must be on or before end date.",
    });
  });
});
