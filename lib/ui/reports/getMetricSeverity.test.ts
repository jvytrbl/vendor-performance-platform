import { describe, it, expect } from "vitest";
import { getMetricDirection } from "./getMetricSeverity";

describe("getMetricDirection", () => {
  it("returns higher-better for on_time_delivery_rate", () => {
    expect(getMetricDirection("on_time_delivery_rate")).toBe("higher-better");
  });

  it("returns lower-better for avg_delay_days", () => {
    expect(getMetricDirection("avg_delay_days")).toBe("lower-better");
  });

  it("returns lower-better for every other colored metric", () => {
    const lowerBetterMetrics = [
      "overcharge_rate",
      "avg_overcharge_pct",
      "shortfall_rate",
      "avg_shortfall_units",
      "overdelivery_rate",
      "avg_overdelivery_units",
    ] as const;

    for (const metric of lowerBetterMetrics) {
      expect(getMetricDirection(metric)).toBe("lower-better");
    }
  });

  // undercharge_rate has no direction by design — ColoredMetricKey excludes
  // it, so passing it is a TypeScript compile error, not something this
  // function needs a runtime branch for. No test calls getMetricDirection
  // with it; that's the point.
});
