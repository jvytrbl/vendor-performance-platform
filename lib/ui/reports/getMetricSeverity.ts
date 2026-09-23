export type MetricSeverity = "success" | "warning" | "danger" | "neutral";

export type ColoredMetricKey =
  | "on_time_delivery_rate"
  | "avg_delay_days"
  | "overcharge_rate"
  | "avg_overcharge_pct"
  | "shortfall_rate"
  | "avg_shortfall_units"
  | "overdelivery_rate"
  | "avg_overdelivery_units";

export type MetricKey = ColoredMetricKey | "undercharge_rate";

interface Band {
  direction: "higher-better" | "lower-better";
  /** Boundary between "success" and "warning", in the metric's own unit. */
  good: number;
  /** Boundary between "warning" and "danger", in the metric's own unit. */
  warn: number;
}

// Proposed defaults inferred from common procurement tolerances — PRODUCT.md
// does not specify bands. Tune per metric here if the thresholds need to
// change; undercharge_rate is intentionally absent (see getMetricSeverity).
const BANDS: Record<ColoredMetricKey, Band> = {
  on_time_delivery_rate: { direction: "higher-better", good: 90, warn: 75 },
  avg_delay_days: { direction: "lower-better", good: 0, warn: 3 },
  overcharge_rate: { direction: "lower-better", good: 0, warn: 10 },
  avg_overcharge_pct: { direction: "lower-better", good: 0, warn: 10 },
  shortfall_rate: { direction: "lower-better", good: 0, warn: 10 },
  avg_shortfall_units: { direction: "lower-better", good: 0, warn: 2 },
  overdelivery_rate: { direction: "lower-better", good: 0, warn: 10 },
  avg_overdelivery_units: { direction: "lower-better", good: 0, warn: 2 },
};

/**
 * Maps a report metric to a good/warning/bad severity for display.
 *
 * `undercharge_rate` always returns "neutral": a vendor undercharging
 * benefits the buyer rather than signaling a performance risk, so it isn't
 * given a good/bad judgment the product doesn't make. Undefined values
 * (no eligible transactions) are always "neutral" regardless of metric.
 */
export function getMetricSeverity(metric: MetricKey, value: number | null): MetricSeverity {
  if (value === null || metric === "undercharge_rate") {
    return "neutral";
  }

  const band = BANDS[metric];
  const isGood = band.direction === "higher-better" ? value >= band.good : value <= band.good;
  if (isGood) {
    return "success";
  }

  const isDanger = band.direction === "higher-better" ? value < band.warn : value > band.warn;
  return isDanger ? "danger" : "warning";
}
