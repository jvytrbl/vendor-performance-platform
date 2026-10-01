import type { ReportSectionInput } from "./validateReportSections";

const BASE_HEADINGS: { key: keyof ReportSectionInput; label: string }[] = [
  { key: "vendor_summary", label: "Vendor Summary" },
  { key: "delivery_performance", label: "Delivery Performance" },
  { key: "pricing_analysis", label: "Pricing Analysis" },
  { key: "order_accuracy", label: "Order Accuracy" },
];

// Only expected when the report has >= 2 vendors (runReportGeneration.ts
// decides this before calling generateReportNarrative/parseNarrativeSections
// at all) — the AI writes explanatory trade-off text only here, never a
// ranking/leader claim; the code-computed summary sentence is prepended
// separately after parsing (see formatVendorComparisonSummary.ts).
const COMPARISON_HEADINGS: { key: keyof ReportSectionInput; label: string }[] = [
  { key: "ai_overall_comparison", label: "Overall Comparison" },
  { key: "ai_delivery_comparison", label: "Delivery Comparison" },
  { key: "ai_pricing_comparison", label: "Pricing Comparison" },
  { key: "ai_order_accuracy_comparison", label: "Order Accuracy Comparison" },
];

export function parseNarrativeSections(
  narrative: string,
  options?: { includeComparison?: boolean }
): ReportSectionInput | null {
  const headings = options?.includeComparison
    ? [...BASE_HEADINGS, ...COMPARISON_HEADINGS]
    : BASE_HEADINGS;

  const text = narrative.replace(/\r\n/g, "\n");
  const marks: { key: keyof ReportSectionInput; headingStart: number; contentStart: number }[] =
    [];

  for (const heading of headings) {
    const pattern = new RegExp(
      `(?:^|\\n)\\s*(?:#{1,3}\\s*)?(?:\\*\\*)?${heading.label}(?:\\*\\*)?:\\s*`,
      "i"
    );
    const match = pattern.exec(text);
    if (!match) return null;
    marks.push({
      key: heading.key,
      headingStart: match.index,
      contentStart: match.index + match[0].length,
    });
  }

  for (let index = 1; index < marks.length; index += 1) {
    if (marks[index].headingStart <= marks[index - 1].contentStart) return null;
  }

  const sections: ReportSectionInput = {
    vendor_summary: "",
    delivery_performance: "",
    pricing_analysis: "",
    order_accuracy: "",
    ...(options?.includeComparison
      ? {
          ai_overall_comparison: "",
          ai_delivery_comparison: "",
          ai_pricing_comparison: "",
          ai_order_accuracy_comparison: "",
        }
      : {}),
  };

  for (let index = 0; index < marks.length; index += 1) {
    const end = index + 1 < marks.length ? marks[index + 1].headingStart : text.length;
    sections[marks[index].key] = text.slice(marks[index].contentStart, end).trim();
  }

  if (headings.some((heading) => sections[heading.key] === "")) return null;

  const unique = new Set(headings.map((heading) => sections[heading.key]));
  if (unique.size === 1) return null;

  return sections;
}
