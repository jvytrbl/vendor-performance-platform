import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { AI_COMPARATIVE_ANALYSIS_DISCLAIMER } from "@/lib/domain/reports/aiComparativeAnalysisDisclaimer";

export interface ExportableReport {
  reference_number: string;
  period_start: string;
  period_end: string;
  vendor_summary: string | null;
  delivery_performance: string | null;
  pricing_analysis: string | null;
  order_accuracy: string | null;
  ai_overall_comparison: string | null;
  ai_delivery_comparison: string | null;
  ai_pricing_comparison: string | null;
  ai_order_accuracy_comparison: string | null;
  // Only used to decide whether the AI Comparative Analysis section (and
  // its disclaimer) is included at all — reports with fewer than 2 vendors
  // never have one, by design.
  vendor_ids: number[];
}

function section(heading: string, text: string | null): Paragraph[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun(heading)],
    }),
    new Paragraph({
      children: [new TextRun(text ?? "")],
    }),
  ];
}

export async function generateDocxReport(report: ExportableReport): Promise<Buffer> {
  const includeComparison = report.vendor_ids.length >= 2;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(`Vendor Performance Report ${report.reference_number}`)],
          }),
          new Paragraph({
            children: [
              new TextRun(`Period: ${report.period_start} to ${report.period_end}`),
            ],
          }),
          ...section("Vendor Summary", report.vendor_summary),
          ...section("Delivery Performance", report.delivery_performance),
          ...section("Pricing Analysis", report.pricing_analysis),
          ...section("Order Accuracy", report.order_accuracy),
          ...(includeComparison
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  children: [new TextRun("AI Comparative Analysis")],
                }),
                new Paragraph({
                  children: [new TextRun(AI_COMPARATIVE_ANALYSIS_DISCLAIMER)],
                }),
                ...section("Overall Comparison", report.ai_overall_comparison),
                ...section("Delivery Comparison", report.ai_delivery_comparison),
                ...section("Pricing Comparison", report.ai_pricing_comparison),
                ...section("Order Accuracy Comparison", report.ai_order_accuracy_comparison),
              ]
            : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
