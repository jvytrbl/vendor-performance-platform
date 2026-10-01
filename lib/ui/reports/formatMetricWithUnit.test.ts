import { describe, expect, it } from "vitest";
import { formatMetricWithUnit } from "./formatMetricWithUnit";

describe("formatMetricWithUnit", () => {
  it("formats a rate as a percentage", () => {
    expect(formatMetricWithUnit("on_time_delivery_rate", 50)).toBe("50%");
    expect(formatMetricWithUnit("overcharge_rate", 12.5)).toBe("12.5%");
    expect(formatMetricWithUnit("undercharge_rate", 0)).toBe("0%");
  });

  it("formats avg_delay_days with the singular/plural 'day'/'days' unit", () => {
    expect(formatMetricWithUnit("avg_delay_days", 1)).toBe("1 day");
    expect(formatMetricWithUnit("avg_delay_days", 6)).toBe("6 days");
    expect(formatMetricWithUnit("avg_delay_days", 0)).toBe("0 days");
  });

  it("formats unit-count metrics with the singular/plural 'unit'/'units' unit", () => {
    expect(formatMetricWithUnit("avg_shortfall_units", 1)).toBe("1 unit");
    expect(formatMetricWithUnit("avg_overdelivery_units", 20)).toBe("20 units");
  });

  it("never mixes a rate and a unit count in one phrase", () => {
    // Regression guard for the exact bug reported: "a 25 overdelivery rate
    // of 20 units" mixed overdelivery_rate (a percentage) with
    // avg_overdelivery_units (a unit count) as if they were one phrase.
    expect(formatMetricWithUnit("overdelivery_rate", 25)).toBe("25%");
    expect(formatMetricWithUnit("avg_overdelivery_units", 20)).toBe("20 units");
  });

  it("displays 'Not enough data' for null, never 0 or blank", () => {
    expect(formatMetricWithUnit("on_time_delivery_rate", null)).toBe("Not enough data");
    expect(formatMetricWithUnit("avg_delay_days", null)).toBe("Not enough data");
    expect(formatMetricWithUnit("avg_shortfall_units", null)).toBe("Not enough data");
  });
});
