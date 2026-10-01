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
  ai_overall_comparison: null,
  ai_delivery_comparison: null,
  ai_pricing_comparison: null,
  ai_order_accuracy_comparison: null,
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

  // Confirms the Vantage branding retrofit actually took effect — an
  // embedded JPEG XObject is present in the raw PDF, which only happens if
  // drawBrandedHeader's embedJpg call ran successfully. Object dictionaries
  // (unlike content streams) are never Flate-compressed by pdf-lib, so this
  // is a reliable raw-byte check, not a guess.
  it("embeds the Vantage logo (branded header) in the output", async () => {
    const buffer = await generatePdfReport(report);
    const raw = buffer.toString("latin1");

    expect(raw).toMatch(/\/Subtype\s*\/Image/);
    expect(raw).toMatch(/\/Filter\s*\/DCTDecode/); // JPEG image filter
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

  // PDF content streams are Flate-compressed, so (unlike the DOCX export)
  // raw-byte substring checks can't confirm specific comparison text made it
  // in. Page count is the behavioral signal available here: adding ~5
  // headings and 4 paragraphs of text pushes a short one-page report onto a
  // second page, while a <2-vendor report with nothing to add stays at one.
  it("does not add any content for the AI Comparative Analysis section when the report has fewer than 2 vendors", async () => {
    const buffer = await generatePdfReport(report);
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(1);
  });

  it("adds the AI Comparative Analysis section when the report has 2+ vendors and the columns are filled in", async () => {
    // Long enough that the added section alone forces a second page -
    // same technique as the "wraps a very long section" test above, needed
    // here because a few short comparison sentences don't reliably push a
    // one-page report over the edge on their own.
    const longComparisonText = "Vendor A outperforms Vendor B overall. ".repeat(200);

    const buffer = await generatePdfReport({
      ...report,
      vendor_ids: [1, 2],
      ai_overall_comparison: longComparisonText,
      ai_delivery_comparison: "Vendor A has the better delivery record.",
      ai_pricing_comparison: "Vendor B is cheaper on average.",
      ai_order_accuracy_comparison: "Both vendors are tied on order accuracy.",
    });
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
