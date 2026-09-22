import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export interface ExportableReport {
  reference_number: string;
  period_start: string;
  period_end: string;
  vendor_summary: string | null;
  delivery_performance: string | null;
  pricing_analysis: string | null;
  order_accuracy: string | null;
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
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
