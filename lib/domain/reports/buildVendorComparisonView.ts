import { splitNarrativeParagraphs } from "@/lib/ui/reports/splitNarrativeParagraphs";
import type { MetricColumnKey } from "@/lib/ui/reports/formatMetricWithUnit";
import {
  rankVendorComparison,
  type CategoryName,
  type RankVendorComparisonResult,
  type VendorRanking,
} from "./rankVendorComparison";
import { formatVendorComparisonSummaries } from "./formatVendorComparisonSummary";
import type { VendorPeriodMetrics } from "./buildMetricPromptData";

// Minimal structural shape this pure domain module needs from a metrics
// row — duck-typed so it never imports the API/repository layer's full
// ReportMetric type. Both lib/api/reports.ts's ReportMetric and
// runReportGeneration.ts's GeneratedMetricRow already satisfy this.
export interface VendorMetricsRow {
  vendor_id: number;
  on_time_delivery_rate: number | null;
  avg_delay_days: number | null;
  overcharge_rate: number | null;
  avg_overcharge_pct: number | null;
  undercharge_rate: number | null;
  shortfall_rate: number | null;
  avg_shortfall_units: number | null;
  overdelivery_rate: number | null;
  avg_overdelivery_units: number | null;
}

export interface MetricColumn {
  key: MetricColumnKey;
  label: string;
  // True only for undercharge_rate in the Pricing table — shown for
  // context, never part of the ranking (rankVendorComparison excludes it
  // entirely; see that module's RankableMetricKey comment).
  unranked?: boolean;
}

export const CATEGORY_METRIC_COLUMNS: Record<CategoryName, MetricColumn[]> = {
  delivery: [
    { key: "on_time_delivery_rate", label: "On-time delivery" },
    { key: "avg_delay_days", label: "Avg delay" },
  ],
  pricing: [
    { key: "overcharge_rate", label: "Overcharge rate" },
    { key: "avg_overcharge_pct", label: "Avg overcharge" },
    { key: "undercharge_rate", label: "Undercharge rate", unranked: true },
  ],
  orderAccuracy: [
    { key: "shortfall_rate", label: "Shortfall rate" },
    { key: "avg_shortfall_units", label: "Avg shortfall" },
    { key: "overdelivery_rate", label: "Over-delivery rate" },
    { key: "avg_overdelivery_units", label: "Avg over-delivery" },
  ],
};

function toVendorPeriodMetrics(row: VendorMetricsRow | undefined): VendorPeriodMetrics {
  return {
    onTimeDeliveryRate: row?.on_time_delivery_rate ?? null,
    avgDelayDays: row?.avg_delay_days ?? null,
    overchargeRate: row?.overcharge_rate ?? null,
    avgOverchargePct: row?.avg_overcharge_pct ?? null,
    underchargeRate: row?.undercharge_rate ?? null,
    shortfallRate: row?.shortfall_rate ?? null,
    avgShortfallUnits: row?.avg_shortfall_units ?? null,
    overdeliveryRate: row?.overdelivery_rate ?? null,
    avgOverdeliveryUnits: row?.avg_overdelivery_units ?? null,
  };
}

// Join rule: key by vendor_id, rename snake_case to camelCase only at this
// boundary. A vendor on the report but absent from metricsRows (e.g. zero
// eligible transactions for the period) defaults to all-null metrics rather
// than throwing — rankVendorComparison already treats all-null the same as
// any other vendor with no eligible transactions in a category: "not enough
// data", never a crash.
export function buildVendorRanking(
  vendorIds: number[],
  metricsRows: VendorMetricsRow[]
): RankVendorComparisonResult {
  const byVendorId = new Map(metricsRows.map((row) => [row.vendor_id, row]));
  const vendors = vendorIds.map((vendorId) => ({
    vendorId,
    metrics: toVendorPeriodMetrics(byVendorId.get(vendorId)),
  }));
  return rankVendorComparison(vendors);
}

export interface VendorComparisonViewInput {
  vendorIds: number[];
  vendorNames: Map<number, string>;
  metricsRows: VendorMetricsRow[];
  storedText: string | null;
}

export interface OverallTableRow {
  vendorId: number;
  vendorName: string;
  overall: VendorRanking;
  categoryRanks: Record<CategoryName, VendorRanking>;
}

export interface CategoryTableRow {
  vendorId: number;
  vendorName: string;
  rank: VendorRanking;
  metrics: Partial<Record<MetricColumnKey, number | null>>;
}

export type OverallSubsectionView =
  | { mode: "empty" }
  | { mode: "text-only"; paragraphs: string[] }
  | { mode: "table"; leadLine: string; commentaryParagraphs: string[]; rows: OverallTableRow[] };

export type CategorySubsectionView =
  | { mode: "empty" }
  | { mode: "text-only"; paragraphs: string[] }
  | { mode: "table"; leadLine: string; commentaryParagraphs: string[]; rows: CategoryTableRow[] };

function nameFor(vendorNames: Map<number, string>, vendorId: number): string {
  return vendorNames.get(vendorId) ?? `Vendor ${vendorId}`;
}

// null -> the section was never generated (fewer than 2 vendors, or a
// legacy draft). Non-null but blank after trimming shouldn't happen in
// practice but is handled the same way, defensively.
function resolveParagraphsOrEmpty(storedText: string | null): string[] | null {
  if (storedText === null) return null;
  const paragraphs = splitNarrativeParagraphs(storedText);
  return paragraphs.length === 0 ? null : paragraphs;
}

export function buildOverallComparisonView(input: VendorComparisonViewInput): OverallSubsectionView {
  const paragraphs = resolveParagraphsOrEmpty(input.storedText);
  if (!paragraphs) return { mode: "empty" };

  const ranking = buildVendorRanking(input.vendorIds, input.metricsRows);
  const summaries = formatVendorComparisonSummaries(ranking, input.vendorNames);

  // The rebuilt table is only trusted when the stored lead sentence still
  // matches what the current code would compute — see
  // formatVendorComparisonSummary.test.ts's pinned-wording test for why this
  // can drift (a manual edit, or a future wording change).
  if (paragraphs[0] !== summaries.overall) {
    return { mode: "text-only", paragraphs };
  }

  const byVendorId = new Map(ranking.vendors.map((vendor) => [vendor.vendorId, vendor]));
  const notEnoughData: VendorRanking = { status: "not-enough-data" };
  const rows: OverallTableRow[] = input.vendorIds.map((vendorId) => {
    const result = byVendorId.get(vendorId);
    return {
      vendorId,
      vendorName: nameFor(input.vendorNames, vendorId),
      overall: result?.overall ?? notEnoughData,
      categoryRanks: result?.categories ?? {
        delivery: notEnoughData,
        pricing: notEnoughData,
        orderAccuracy: notEnoughData,
      },
    };
  });

  return {
    mode: "table",
    leadLine: summaries.overall,
    commentaryParagraphs: paragraphs.slice(1),
    rows,
  };
}

export function buildCategoryComparisonView(
  category: CategoryName,
  input: VendorComparisonViewInput
): CategorySubsectionView {
  const paragraphs = resolveParagraphsOrEmpty(input.storedText);
  if (!paragraphs) return { mode: "empty" };

  const ranking = buildVendorRanking(input.vendorIds, input.metricsRows);
  const summaries = formatVendorComparisonSummaries(ranking, input.vendorNames);
  const expectedLead = summaries[category];

  if (paragraphs[0] !== expectedLead) {
    return { mode: "text-only", paragraphs };
  }

  const metricsByVendorId = new Map(input.metricsRows.map((row) => [row.vendor_id, row]));
  const rankByVendorId = new Map(
    ranking.vendors.map((vendor) => [vendor.vendorId, vendor.categories[category]])
  );
  const columns = CATEGORY_METRIC_COLUMNS[category];

  const rows: CategoryTableRow[] = input.vendorIds.map((vendorId) => {
    const metricsRow = metricsByVendorId.get(vendorId);
    const metrics: Partial<Record<MetricColumnKey, number | null>> = {};
    for (const column of columns) {
      metrics[column.key] = metricsRow ? metricsRow[column.key] : null;
    }
    return {
      vendorId,
      vendorName: nameFor(input.vendorNames, vendorId),
      rank: rankByVendorId.get(vendorId) ?? { status: "not-enough-data" },
      metrics,
    };
  });

  return {
    mode: "table",
    leadLine: expectedLead,
    commentaryParagraphs: paragraphs.slice(1),
    rows,
  };
}
