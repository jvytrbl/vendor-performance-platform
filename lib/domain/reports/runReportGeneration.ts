import type { TransactionRecord } from "../../repositories/transactions";
import type { ReportSectionInput } from "./validateReportSections";
import type { GenerateContent } from "../../ai/generateReportNarrative";
import { generateReportNarrative } from "../../ai/generateReportNarrative";
import { buildMetricPromptData } from "./buildMetricPromptData";
import { computeVendorPeriodMetrics } from "./computeVendorPeriodMetrics";
import { parseNarrativeSections } from "./parseNarrativeSections";
import { validateNarrativeNumbers } from "./validateNarrativeNumbers";
import { validateNarrativeComparisons } from "./validateNarrativeComparisons";
import { rankVendorComparison } from "./rankVendorComparison";
import { formatVendorComparisonSummaries } from "./formatVendorComparisonSummary";
import { validateVendorComparisonNarrative } from "./validateVendorComparisonNarrative";

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

  // The AI Comparative Analysis section only exists for reports with >= 2
  // vendors — for exactly 1 vendor, `comparison` stays null and every
  // downstream step (prompt, parsing, the four new output fields) is
  // skipped entirely, leaving today's 4-section generation byte-identical.
  const comparison =
    input.vendorIds.length >= 2 ? rankVendorComparison(currentByVendor) : null;
  const comparisonSummaries = comparison
    ? formatVendorComparisonSummaries(comparison, input.vendorNames)
    : null;

  try {
    for (let attempt = 0; attempt < MAX_NARRATIVE_ATTEMPTS; attempt += 1) {
      const narrative = await generateReportNarrative(promptData, input.generateContent, {
        comparisonData: comparison ?? undefined,
      });
      if (narrative.trim() === "") {
        console.warn(`[runReportGeneration] attempt ${attempt + 1}: model returned an empty narrative`);
        continue;
      }
      const sections = parseNarrativeSections(narrative, {
        includeComparison: comparison !== null,
      });
      if (!sections) {
        console.warn(
          `[runReportGeneration] attempt ${attempt + 1}: narrative was not the expected sections`
        );
        continue;
      }
      const sectionTexts = [
        sections.vendor_summary,
        sections.delivery_performance,
        sections.pricing_analysis,
        sections.order_accuracy,
      ];
      const comparisonSectionTexts = comparison
        ? [
            sections.ai_overall_comparison,
            sections.ai_delivery_comparison,
            sections.ai_pricing_comparison,
            sections.ai_order_accuracy_comparison,
          ].filter((text): text is string => typeof text === "string")
        : [];
      const numbers = validateNarrativeNumbers(
        [...sectionTexts, ...comparisonSectionTexts].join("\n"),
        promptData
      );
      if (!numbers.valid) {
        console.warn(
          `[runReportGeneration] attempt ${attempt + 1}: narrative number validation failed`,
          { unmatchedValues: numbers.unmatchedValues, narrative }
        );
        continue;
      }
      // Comparison sections are explanatory trade-off commentary, not
      // prior-period/peer-average narrative — validateNarrativeComparisons'
      // phrase requirement doesn't fit their purpose, so it only applies to
      // the original four, same as before this feature existed.
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

      // Checks the AI-authored text only (never the code-generated leader
      // sentence, which isn't computed yet at parse time anyway) — confirms
      // no vendor other than the computed leader(s) is named as leading.
      if (comparison) {
        const subsectionChecks: [string, string | null | undefined, number[]][] = [
          ["overall", sections.ai_overall_comparison, comparison.overallLeaders],
          ["delivery", sections.ai_delivery_comparison, comparison.categoryLeaders.delivery],
          ["pricing", sections.ai_pricing_comparison, comparison.categoryLeaders.pricing],
          [
            "orderAccuracy",
            sections.ai_order_accuracy_comparison,
            comparison.categoryLeaders.orderAccuracy,
          ],
        ];
        const failedLeaderCheck = subsectionChecks.find(
          ([, text, leaders]) =>
            typeof text === "string" &&
            !validateVendorComparisonNarrative(text, leaders, input.vendorNames).valid
        );
        if (failedLeaderCheck) {
          console.warn(
            `[runReportGeneration] attempt ${attempt + 1}: comparison narrative named a non-leader vendor as leading`,
            { subsection: failedLeaderCheck[0], narrative }
          );
          continue;
        }
      }

      const finalSections: ReportSectionInput = comparison && comparisonSummaries
        ? {
            vendor_summary: sections.vendor_summary,
            delivery_performance: sections.delivery_performance,
            pricing_analysis: sections.pricing_analysis,
            order_accuracy: sections.order_accuracy,
            ai_overall_comparison: `${comparisonSummaries.overall}\n\n${sections.ai_overall_comparison}`,
            ai_delivery_comparison: `${comparisonSummaries.delivery}\n\n${sections.ai_delivery_comparison}`,
            ai_pricing_comparison: `${comparisonSummaries.pricing}\n\n${sections.ai_pricing_comparison}`,
            ai_order_accuracy_comparison: `${comparisonSummaries.orderAccuracy}\n\n${sections.ai_order_accuracy_comparison}`,
          }
        : {
            vendor_summary: sections.vendor_summary,
            delivery_performance: sections.delivery_performance,
            pricing_analysis: sections.pricing_analysis,
            order_accuracy: sections.order_accuracy,
            ai_overall_comparison: null,
            ai_delivery_comparison: null,
            ai_pricing_comparison: null,
            ai_order_accuracy_comparison: null,
          };

      return {
        ok: true,
        sections: finalSections,
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
