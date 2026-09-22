import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { generateDocxReport } from "./generateDocxReport";

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

async function extractDocumentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = zip.file("word/document.xml");
  if (!documentXml) {
    throw new Error("word/document.xml not found in generated docx");
  }
  return documentXml.async("text");
}

describe("generateDocxReport", () => {
  it("produces a valid docx file containing the report's actual section text", async () => {
    const buffer = await generateDocxReport(report);

    expect(buffer.subarray(0, 4).toString("hex")).toBe("504b0304"); // PK\x03\x04 zip magic

    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("Vendor summary text.");
    expect(xml).toContain("Delivery performance text.");
    expect(xml).toContain("Pricing analysis text.");
    expect(xml).toContain("Order accuracy text.");
    expect(xml).toContain("VPR-20260101-123456");
  });

  // Category 8 (security-hostile input), SDD §7.2: the export must use the
  // library's safe text-insertion API, never a hand-built XML template, so
  // that stored text can never break out of the document structure.
  it("treats XML-structure-shaped section text as inert literal content, not markup", async () => {
    const hostileText =
      '</w:t></w:p><w:p><w:t>INJECTED PARAGRAPH & "quotes" <tag>';

    const buffer = await generateDocxReport({
      ...report,
      vendor_summary: hostileText,
    });

    const xml = await extractDocumentXml(buffer);

    // The raw hostile markup must not appear unescaped in the XML — a
    // string-concatenation bug would let `</w:t></w:p><w:p><w:t>` and the
    // literal `<tag>` pass straight through as real structure/elements.
    expect(xml).not.toContain("</w:t></w:p><w:p><w:t>INJECTED PARAGRAPH");
    expect(xml).not.toContain("<tag>");

    const decoded = xml
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
    expect(decoded).toContain(hostileText);
  });

  // Category 6 (extreme scale): a very long section shouldn't throw or
  // produce a corrupt document — shallow smoke test, not deep pagination
  // correctness, consistent with this being a low-traffic single-user tool.
  it("still produces a valid docx when a section is very long", async () => {
    const longText = "Delivery was on time. ".repeat(2000);

    const buffer = await generateDocxReport({
      ...report,
      delivery_performance: longText,
    });

    expect(buffer.subarray(0, 4).toString("hex")).toBe("504b0304");
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("Delivery was on time.");
  });
});
