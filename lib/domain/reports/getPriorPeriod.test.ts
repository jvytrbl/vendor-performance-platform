import { it, describe, expect } from "vitest";
import { getPriorPeriod } from "./getPriorPeriod";

describe("getPriorPeriod", () => {
  it("returns the immediately preceding period of equal length for a custom range", () => {
    const result = getPriorPeriod({
      periodStart: "2026-03-01",
      periodEnd: "2026-04-16",
    });
    // 47 inclusive days; prior period ends the day before 1 Mar
    expect(result).toEqual({
      periodStart: "2026-01-13",
      periodEnd: "2026-02-28",
    });
  });

  it("returns the immediately preceding period of equal length for a calendar quarter", () => {
    const result = getPriorPeriod({
      periodStart: "2026-01-01",
      periodEnd: "2026-03-31",
    });
    // Q1 2026 is 90 days; prior period is the 90 days ending 31 Dec 2025
    expect(result).toEqual({
      periodStart: "2025-10-03",
      periodEnd: "2025-12-31",
    });
  });

  it("keeps a one-day period as one day, ending the day before the current start", () => {
    const result = getPriorPeriod({
      periodStart: "2026-06-15",
      periodEnd: "2026-06-15",
    });
    expect(result).toEqual({
      periodStart: "2026-06-14",
      periodEnd: "2026-06-14",
    });
  });

  it("crosses the year boundary when the current period starts on 1 January", () => {
    const result = getPriorPeriod({
      periodStart: "2026-01-01",
      periodEnd: "2026-01-07",
    });
    expect(result).toEqual({
      periodStart: "2025-12-25",
      periodEnd: "2025-12-31",
    });
  });

  it("uses the extra leap day when the current period includes 29 February", () => {
    const result = getPriorPeriod({
      periodStart: "2024-01-01",
      periodEnd: "2024-03-31",
    });
    // Q1 2024 is 91 days because 2024 is a leap year
    expect(result).toEqual({
      periodStart: "2023-10-02",
      periodEnd: "2023-12-31",
    });
  });
});
