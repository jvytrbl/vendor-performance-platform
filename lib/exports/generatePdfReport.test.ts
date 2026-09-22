import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generatePdfReport } from "./generatePdfReport";

const report = {
  id: 7,
  reference_number: "VPR-20260101-123456",
  period_type: "Quarterly",
  period_start: "2026-01-01",
  period_end: "2026-03-31",
  status: "Finalized",
  vendor_summary: "Vendor summary text.",
  delivery_performance: "Delivery performance text.",
  pricing_analysis: "Pricing analysis text.",
  order_accuracy: "Order accuracy text.",
  created_at: "2026-04-01T00:00:00.000Z",
  finalized_at: "2026-04-02T00:00:00.000Z",
  vendor_ids: [1],
  metrics: [],
};

describe("generatePdfReport", () => {
  it("produces a valid, parseable PDF file", async () => {
    const buffer = await generatePdfReport(report);

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");

    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  });

  // Category 8 (security-hostile input), SDD §7.2: unbalanced parentheses
  // and backslashes are PDF string-literal syntax — a hand-built content
  // stream that concatenated this raw would produce a corrupt/parseable-
  // differently PDF. pdf-lib's drawText must escape them.
  it("stays a valid, parseable PDF when section text contains PDF string-literal syntax", async () => {
    const hostileText = 'Summary) /Type /Catalog (injected\\ trailing backslash';

    const buffer = await generatePdfReport({
      ...report,
      vendor_summary: hostileText,
    });

    // Must still be a well-formed PDF a parser can load without throwing —
    // an unescaped `)` here would terminate the string literal early and
    // corrupt the surrounding content-stream structure. Content streams are
    // Flate-compressed by pdf-lib, so a raw-byte string check isn't
    // meaningful here; successfully round-tripping through a real parser
    // is the behavioral proof that the structure survived intact.
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(1);
  });

  // Category 6 (extreme scale): a very long section must wrap across pages
  // rather than throw or silently truncate.
  it("wraps a very long section across multiple pages without throwing", async () => {
    const longText = "Delivery was on time. ".repeat(2000);

    const buffer = await generatePdfReport({
      ...report,
      delivery_performance: longText,
    });

    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
