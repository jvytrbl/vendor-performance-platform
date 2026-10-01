export type MetricColumnKey =
  | "on_time_delivery_rate"
  | "avg_delay_days"
  | "overcharge_rate"
  | "avg_overcharge_pct"
  | "undercharge_rate"
  | "shortfall_rate"
  | "avg_shortfall_units"
  | "overdelivery_rate"
  | "avg_overdelivery_units";

type MetricUnit = "percent" | "days" | "units";

// Rates and percentages always read as "%"; avg_delay_days reads in days;
// the two "avg_*_units" metrics read in units. Never mixed in one phrase —
// this is the single place that decides a metric's unit, so the vendor
// comparison table and the exporters (which reuse this) can't disagree.
const METRIC_UNITS: Record<MetricColumnKey, MetricUnit> = {
  on_time_delivery_rate: "percent",
  avg_delay_days: "days",
  overcharge_rate: "percent",
  avg_overcharge_pct: "percent",
  undercharge_rate: "percent",
  shortfall_rate: "percent",
  avg_shortfall_units: "units",
  overdelivery_rate: "percent",
  avg_overdelivery_units: "units",
};

// Null means "no eligible transactions for this metric" (per PRODUCT.md, a
// metric with no eligible transactions is undefined, not zero) — displayed
// as "Not enough data", never 0 or a blank cell.
export function formatMetricWithUnit(key: MetricColumnKey, value: number | null): string {
  if (value === null) return "Not enough data";

  const unit = METRIC_UNITS[key];
  if (unit === "percent") return `${value}%`;
  if (unit === "days") return `${value} ${value === 1 ? "day" : "days"}`;
  return `${value} ${value === 1 ? "unit" : "units"}`;
}
