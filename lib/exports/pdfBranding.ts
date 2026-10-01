import { readFile } from "fs/promises";
import path from "path";
import type { PDFDocument, PDFFont, PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";

const LOGO_PATH = path.join(process.cwd(), "public", "vpp_logo.jpg");
const LOGO_DISPLAY_HEIGHT = 28;
const WORDMARK_TEXT = "Vantage";
const WORDMARK_SIZE = 16;
const HEADER_BOTTOM_GAP = 20;

export interface BrandedHeaderOptions {
  margin: number;
  pageHeight: number;
  boldFont: PDFFont;
}

// The only piece shared between generatePdfReport.ts and
// generateAuditLogPdf.ts — deliberately minimal: the logo + "Vantage"
// wordmark at the top of the first page only, nothing about either export's
// own section/table layout below it. Returns the y-coordinate callers
// should start drawing their own content from, underneath the header.
export async function drawBrandedHeader(
  pdfDoc: PDFDocument,
  page: PDFPage,
  { margin, pageHeight, boldFont }: BrandedHeaderOptions
): Promise<number> {
  const logoBytes = await readFile(LOGO_PATH);
  const logoImage = await pdfDoc.embedJpg(logoBytes);
  const scale = LOGO_DISPLAY_HEIGHT / logoImage.height;
  const logoWidth = logoImage.width * scale;

  const logoY = pageHeight - margin - LOGO_DISPLAY_HEIGHT;

  page.drawImage(logoImage, {
    x: margin,
    y: logoY,
    width: logoWidth,
    height: LOGO_DISPLAY_HEIGHT,
  });

  page.drawText(WORDMARK_TEXT, {
    x: margin + logoWidth + 10,
    y: logoY + (LOGO_DISPLAY_HEIGHT - WORDMARK_SIZE) / 2 + 2,
    size: WORDMARK_SIZE,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  return logoY - HEADER_BOTTOM_GAP;
}
