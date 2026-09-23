import type { TransactionRecord } from "../../repositories/transactions";
import type { ReportSectionInput } from "./validateReportSections";
import type { GenerateContent } from "../../ai/generateReportNarrative";
import { generateReportNarrative } from "../../ai/generateReportNarrative";
import { buildMetricPromptData } from "./buildMetricPromptData";
import { computeVendorPeriodMetrics } from "./computeVendorPeriodMetrics";
import { parseNarrativeSections } from "./parseNarrativeSections";
import { validateNarrativeNumbers } from "./validateNarrativeNumbers";
import { validateNarrativeComparisons } from "./validateNarrativeComparisons";

const MAX_NARRATIVE_ATTEMPTS = 3;

export interface GeneratedMetricRow {
  vendor_id: number;
  period_start: string;
  period_end: string;
  on_time_delivery_rate: number | null;
  avg_delay_days: number | null;
  overcharge_rate: number | null;
  avg_overcharge_pct: number | null;
  undercharge_rate: number | null;
  shortfall_rate: number | null;
  avg_shortfall_units: number | null;
  overdelivery_rate: number | null;
  avg_overdelivery_units: number | null;
  transaction_count: number;
}

export type RunReportGenerationResult =
  | { ok: true; sections: ReportSectionInput; metrics: GeneratedMetricRow[] }
  | { ok: false; error: string; code: string };

function txsForVendor(transactions: TransactionRecord[], vendorId: number) {
  return transactions.filter((transaction) => transaction.vendor_id === vendorId);
}

function toMetricRow(
  vendorId: number,
  periodStart: string,
  periodEnd: string,
  computed: ReturnType<typeof computeVendorPeriodMetrics>
): GeneratedMetricRow {
  return {
    vendor_id: vendorId,
    period_start: periodStart,
    period_end: periodEnd,
    on_time_delivery_rate: computed.onTimeDeliveryRate,
    avg_delay_days: computed.avgDelayDays,
    overcharge_rate: computed.overchargeRate,
    avg_overcharge_pct: computed.avgOverchargePct,
    undercharge_rate: computed.underchargeRate,
    shortfall_rate: computed.shortfallRate,
    avg_shortfall_units: computed.avgShortfallUnits,
    overdelivery_rate: computed.overdeliveryRate,
    avg_overdelivery_units: computed.avgOverdeliveryUnits,
    transaction_count: computed.transactionCount,
  };
}

export async function runReportGeneration(input: {
  vendorIds: number[];
  vendorNames: Map<number, string>;
  currentPeriod: { periodStart: string; periodEnd: string };
  priorPeriod: { periodStart: string; periodEnd: string };
  currentTxs: TransactionRecord[];
  priorTxs: TransactionRecord[];
  generateContent: GenerateContent;
}): Promise<RunReportGenerationResult> {
  const currentByVendor = input.vendorIds.map((vendorId) => ({
    vendorId,
    metrics: computeVendorPeriodMetrics(txsForVendor(input.currentTxs, vendorId)),
  }));
  const priorByVendor = input.vendorIds.map((vendorId) => ({
    vendorId,
    metrics: computeVendorPeriodMetrics(txsForVendor(input.priorTxs, vendorId)),
  }));

  const promptData: Record<string, number | string | null> = {};
  for (const current of currentByVendor) {
    const prior = priorByVendor.find((row) => row.vendorId === current.vendorId)!;
    const built = buildMetricPromptData({
      vendorId: current.vendorId,
      current: current.metrics,
      prior: prior.metrics,
      peers: currentByVendor,
    });
    // The model can only refer to vendors by what's actually in the data it
    // receives — without this, it has nothing but the numeric ID and falls
    // back to writing "Vendor 7" in the narrative.
    promptData[`vendor${current.vendorId}_name`] =
      input.vendorNames.get(current.vendorId) ?? `Vendor ${current.vendorId}`;
    for (const [key, value] of Object.entries(built)) {
      promptData[`vendor${current.vendorId}_${key}`] = value;
    }
  }

  const metrics = [
    ...currentByVendor.map((row) =>
      toMetricRow(
        row.vendorId,
        input.currentPeriod.periodStart,
        input.currentPeriod.periodEnd,
        row.metrics
      )
    ),
    ...priorByVendor.map((row) =>
      toMetricRow(
        row.vendorId,
        input.priorPeriod.periodStart,
        input.priorPeriod.periodEnd,
        row.metrics
      )
    ),
  ];

  try {
    for (let attempt = 0; attempt < MAX_NARRATIVE_ATTEMPTS; attempt += 1) {
      const narrative = await generateReportNarrative(promptData, input.generateContent);
      if (narrative.trim() === "") {
        console.warn(`[runReportGeneration] attempt ${attempt + 1}: model returned an empty narrative`);
        continue;
      }
      const sections = parseNarrativeSections(narrative);
      if (!sections) {
        console.warn(
          `[runReportGeneration] attempt ${attempt + 1}: narrative was not four distinct sections`
        );
        continue;
      }
      const sectionTexts = [
        sections.vendor_summary,
        sections.delivery_performance,
        sections.pricing_analysis,
        sections.order_accuracy,
      ];
      const numbers = validateNarrativeNumbers(sectionTexts.join("\n"), promptData);
      if (!numbers.valid) {
        console.warn(
          `[runReportGeneration] attempt ${attempt + 1}: narrative number validation failed`,
          { unmatchedValues: numbers.unmatchedValues, narrative }
        );
        continue;
      }
      const failedComparison = sectionTexts.find(
        (text) => !validateNarrativeComparisons(text).valid
      );
      if (failedComparison) {
        console.warn(
          `[runReportGeneration] attempt ${attempt + 1}: narrative comparison validation failed`,
          { narrative }
        );
        continue;
      }
      return {
        ok: true,
        sections,
        metrics,
      };
    }
  } catch (error) {
    console.error(
      "[runReportGeneration] generation threw before validation could run",
      error
    );
    return {
      ok: false,
      error: "AI generation failed; nothing was saved",
      code: "AI_UNAVAILABLE",
    };
  }

  return {
    ok: false,
    error: "Generated narrative failed validation; nothing was saved",
    code: "NARRATIVE_VALIDATION_FAILED",
  };
}
