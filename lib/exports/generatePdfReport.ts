import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ExportableReport } from "./generateDocxReport";

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const LINE_HEIGHT = 16;

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  for (const paragraphLine of text.split("\n")) {
    let remaining = paragraphLine;
    if (remaining.length === 0) {
      lines.push("");
      continue;
    }
    while (remaining.length > maxCharsPerLine) {
      let breakAt = remaining.lastIndexOf(" ", maxCharsPerLine);
      if (breakAt <= 0) {
        breakAt = maxCharsPerLine;
      }
      lines.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt).trimStart();
    }
    lines.push(remaining);
  }
  return lines;
}

export async function generatePdfReport(report: ExportableReport): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function ensureSpace() {
    if (y < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function drawHeading(text: string) {
    ensureSpace();
    page.drawText(text, { x: MARGIN, y, size: 14, font: boldFont, color: rgb(0, 0, 0) });
    y -= LINE_HEIGHT * 1.5;
  }

  function drawParagraph(text: string) {
    for (const line of wrapText(text, 90)) {
      ensureSpace();
      page.drawText(line, { x: MARGIN, y, size: 11, font, color: rgb(0, 0, 0) });
      y -= LINE_HEIGHT;
    }
    y -= LINE_HEIGHT / 2;
  }

  drawHeading(`Vendor Performance Report ${report.reference_number}`);
  drawParagraph(`Period: ${report.period_start} to ${report.period_end}`);

  drawHeading("Vendor Summary");
  drawParagraph(report.vendor_summary ?? "");

  drawHeading("Delivery Performance");
  drawParagraph(report.delivery_performance ?? "");

  drawHeading("Pricing Analysis");
  drawParagraph(report.pricing_analysis ?? "");

  drawHeading("Order Accuracy");
  drawParagraph(report.order_accuracy ?? "");

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
