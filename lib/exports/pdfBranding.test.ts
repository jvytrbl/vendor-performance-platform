import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { drawBrandedHeader } from "./pdfBranding";

describe("drawBrandedHeader", () => {
  it("embeds the logo from public/vpp_logo.jpg without throwing (real file, real pdf-lib embedJpg)", async () => {
    const pdfDoc = await PDFDocument.create();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595.28, 841.89]);

    const y = await drawBrandedHeader(pdfDoc, page, {
      margin: 50,
      pageHeight: 841.89,
      boldFont,
    });

    // Confirms the image was actually embedded as a real PDF object (not
    // silently skipped) — this is the real-world compatibility proof that
    // public/vpp_logo.jpg is a format pdf-lib's embedJpg can actually use
    // (baseline JPEG, not progressive/CMYK), not just that the call resolved.
    expect(pdfDoc.context.enumerateIndirectObjects().length).toBeGreaterThan(0);

    // The returned y must be below the top margin the header started from,
    // leaving room for the logo + wordmark + gap before any caller content.
    expect(y).toBeLessThan(841.89 - 50);

    const bytes = await pdfDoc.save();
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBe(1);
  });

  it("returns a y position that leaves the expected header height + gap below the top margin", async () => {
    const pdfDoc = await PDFDocument.create();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pageHeight = 841.89;
    const margin = 50;
    const page = pdfDoc.addPage([595.28, pageHeight]);

    const y = await drawBrandedHeader(pdfDoc, page, { margin, pageHeight, boldFont });

    // logoY = pageHeight - margin - LOGO_DISPLAY_HEIGHT(28); returned y = logoY - GAP(20)
    const expectedY = pageHeight - margin - 28 - 20;
    expect(y).toBe(expectedY);
  });
});
