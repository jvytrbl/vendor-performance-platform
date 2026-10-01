import { ordinal } from "@/lib/domain/reports/formatVendorComparisonSummary";
import type { VendorRanking } from "@/lib/domain/reports/rankVendorComparison";

// Text, not color, carries the rank (the comparison table must not rely on
// color alone) — "1st", "2nd", "Tied 2nd", or "Not enough data".
export function formatVendorRankText(ranking: VendorRanking): string {
  if (ranking.status === "not-enough-data") return "Not enough data";
  return ranking.tied ? `Tied ${ordinal(ranking.rank)}` : ordinal(ranking.rank);
}
