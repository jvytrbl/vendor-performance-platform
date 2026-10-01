import { getMetricDirection, type ColoredMetricKey } from "@/lib/ui/reports/getMetricSeverity";
import type { MetricKey, VendorPeriodMetrics } from "./buildMetricPromptData";

export type CategoryName = "delivery" | "pricing" | "orderAccuracy";

// Code computes the ranking; the AI only explains it (per design) — this
// discriminated union is what gets serialized into the AI's prompt data and
// checked against by Stage 2's validator, so "not enough data" is always an
// explicit status, never an absent/null field a caller could misread.
export type VendorRanking =
  | { status: "ranked"; rank: number; tied: boolean }
  | { status: "not-enough-data" };

export interface VendorComparisonResult {
  vendorId: number;
  categories: Record<CategoryName, VendorRanking>;
  overall: VendorRanking;
}

export interface RankVendorComparisonResult {
  vendors: VendorComparisonResult[];
  categoryLeaders: Record<CategoryName, number[]>;
  overallLeaders: number[];
}

export interface VendorMetricsInput {
  vendorId: number;
  metrics: VendorPeriodMetrics;
}

// undercharge_rate is deliberately excluded from every category: it has no
// ranking direction (getMetricSeverity.ts — undercharging benefits the
// buyer, not a performance signal), so it is never a ranking input. It
// still appears in the metrics table elsewhere, unaffected by this module.
type RankableMetricKey = Exclude<MetricKey, "underchargeRate">;

const CATEGORY_METRICS: Record<CategoryName, RankableMetricKey[]> = {
  delivery: ["onTimeDeliveryRate", "avgDelayDays"],
  pricing: ["overchargeRate", "avgOverchargePct"],
  orderAccuracy: ["shortfallRate", "avgShortfallUnits", "overdeliveryRate", "avgOverdeliveryUnits"],
};

// Translates this module's camelCase metric keys (matching the already-
// computed VendorPeriodMetrics shape) to getMetricSeverity.ts's snake_case
// keys, so direction is read from its BANDS table — the single source of
// truth — rather than re-encoded here.
const BAND_KEY: Record<RankableMetricKey, ColoredMetricKey> = {
  onTimeDeliveryRate: "on_time_delivery_rate",
  avgDelayDays: "avg_delay_days",
  overchargeRate: "overcharge_rate",
  avgOverchargePct: "avg_overcharge_pct",
  shortfallRate: "shortfall_rate",
  avgShortfallUnits: "avg_shortfall_units",
  overdeliveryRate: "overdelivery_rate",
  avgOverdeliveryUnits: "avg_overdelivery_units",
};

// Scores (averages of integer ranks) are rounded to this precision before
// being compared for ties, so floating-point noise from averaging (e.g.
// 2.3333333333333335) can never split what should be a tie. Pinned by a
// test — see rankVendorComparison.test.ts.
const SCORE_PRECISION = 4;

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

// Standard competition ranking ("1,1,3" style): equal scores share the
// lower rank, and the next distinct score jumps by the number of items tied
// ahead of it. `score` must already be quantized by the caller (rounded to
// SCORE_PRECISION, or a raw already-2dp metric value) so floating-point
// noise can't create a false distinction between two values that should
// compare equal. Lower score always means better rank (callers negate
// higher-better metric values before calling this).
function competitionRank(
  items: { id: number; score: number }[]
): Map<number, { rank: number; tied: boolean }> {
  const sorted = [...items].sort((a, b) => a.score - b.score);
  const result = new Map<number, { rank: number; tied: boolean }>();

  let rank = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || sorted[i].score !== sorted[i - 1].score) {
      rank = i + 1;
    }
    result.set(sorted[i].id, { rank, tied: false });
  }

  const countByRank = new Map<number, number>();
  for (const entry of result.values()) {
    countByRank.set(entry.rank, (countByRank.get(entry.rank) ?? 0) + 1);
  }
  for (const [id, entry] of result) {
    result.set(id, { ...entry, tied: (countByRank.get(entry.rank) ?? 0) > 1 });
  }

  return result;
}

const CATEGORY_NAMES = Object.keys(CATEGORY_METRICS) as CategoryName[];

/**
 * Ranks vendors within a single report, for the current period only.
 *
 * Per category: each metric is ranked across vendors independently (nulls
 * excluded from that metric's ranking — never treated as zero or worst), a
 * vendor's category score is the average of its own metric ranks, then
 * vendors are ranked by category score. A vendor with zero ranked metrics
 * in a category gets "not-enough-data" for that category.
 *
 * Overall: average of a vendor's three category ranks, equal weight. A
 * vendor must be ranked in all three categories to get an overall rank;
 * otherwise its overall result is "not-enough-data".
 *
 * Pure function — no I/O, no AI call. Caller supplies current-period
 * metrics only (the same shape `runReportGeneration.ts` already computes).
 */
export function rankVendorComparison(vendors: VendorMetricsInput[]): RankVendorComparisonResult {
  // Step 1: rank every vendor on every rankable metric, independently.
  const metricRanks = new Map<RankableMetricKey, Map<number, number>>();

  for (const metricKey of CATEGORY_NAMES.flatMap((category) => CATEGORY_METRICS[category])) {
    if (metricRanks.has(metricKey)) continue; // orderAccuracy/etc. never repeat keys, but stay defensive
    const direction = getMetricDirection(BAND_KEY[metricKey]);
    const present = vendors
      .map((vendor) => ({ id: vendor.vendorId, value: vendor.metrics[metricKey] }))
      .filter((entry): entry is { id: number; value: number } => entry.value !== null);

    if (present.length === 0) continue;

    const scored = present.map((entry) => ({
      id: entry.id,
      score: direction === "higher-better" ? -entry.value : entry.value,
    }));
    const ranked = competitionRank(scored);
    metricRanks.set(
      metricKey,
      new Map(Array.from(ranked, ([id, { rank }]) => [id, rank]))
    );
  }

  // Step 2: category score = average of a vendor's own metric ranks in that category.
  const categoryScores: Record<CategoryName, Map<number, number>> = {
    delivery: new Map(),
    pricing: new Map(),
    orderAccuracy: new Map(),
  };

  for (const category of CATEGORY_NAMES) {
    for (const vendor of vendors) {
      const ranks = CATEGORY_METRICS[category]
        .map((metricKey) => metricRanks.get(metricKey)?.get(vendor.vendorId))
        .filter((rank): rank is number => rank !== undefined);
      if (ranks.length === 0) continue;
      const average = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;
      categoryScores[category].set(vendor.vendorId, round(average, SCORE_PRECISION));
    }
  }

  // Step 3: rank vendors within each category by their category score.
  const categoryRankings: Record<CategoryName, Map<number, { rank: number; tied: boolean }>> = {
    delivery: new Map(),
    pricing: new Map(),
    orderAccuracy: new Map(),
  };
  const categoryLeaders: Record<CategoryName, number[]> = {
    delivery: [],
    pricing: [],
    orderAccuracy: [],
  };

  for (const category of CATEGORY_NAMES) {
    const entries = Array.from(categoryScores[category], ([id, score]) => ({ id, score }));
    const ranked = competitionRank(entries);
    categoryRankings[category] = ranked;
    for (const [id, { rank }] of ranked) {
      if (rank === 1) categoryLeaders[category].push(id);
    }
  }

  // Step 4: overall = average of a vendor's three category ranks, only if
  // it was ranked (not "not-enough-data") in every category.
  const overallScores = new Map<number, number>();
  for (const vendor of vendors) {
    const ranksPerCategory = CATEGORY_NAMES.map(
      (category) => categoryRankings[category].get(vendor.vendorId)?.rank
    );
    if (ranksPerCategory.some((rank) => rank === undefined)) continue;
    const ranks = ranksPerCategory as number[];
    const average = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;
    overallScores.set(vendor.vendorId, round(average, SCORE_PRECISION));
  }

  const overallRanking = competitionRank(
    Array.from(overallScores, ([id, score]) => ({ id, score }))
  );
  const overallLeaders = Array.from(overallRanking.entries())
    .filter(([, { rank }]) => rank === 1)
    .map(([id]) => id);

  // Assemble the per-vendor result.
  const vendorResults: VendorComparisonResult[] = vendors.map((vendor) => {
    const categories = {} as Record<CategoryName, VendorRanking>;
    for (const category of CATEGORY_NAMES) {
      const entry = categoryRankings[category].get(vendor.vendorId);
      categories[category] = entry
        ? { status: "ranked", rank: entry.rank, tied: entry.tied }
        : { status: "not-enough-data" };
    }

    const overallEntry = overallRanking.get(vendor.vendorId);
    const overall: VendorRanking = overallEntry
      ? { status: "ranked", rank: overallEntry.rank, tied: overallEntry.tied }
      : { status: "not-enough-data" };

    return { vendorId: vendor.vendorId, categories, overall };
  });

  return { vendors: vendorResults, categoryLeaders, overallLeaders };
}
