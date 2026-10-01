import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { drawBrandedHeader } from "./pdfBranding";
import type { AuditLogRecord } from "@/lib/repositories/auditLog";

// Landscape, not D1's portrait — a 5-column table needs more horizontal
// room than a narrative report does. Same A4 area, just rotated.
const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 50;
const ROW_HEIGHT = 16;
const TABLE_FONT_SIZE = 9;

interface Column {
  label: string;
  width: number;
}

const COLUMNS: Column[] = [
  { label: "Timestamp", width: 120 },
  { label: "User email", width: 190 },
  { label: "Action", width: 150 },
  { label: "Target", width: 110 },
  { label: "IP address", width: 130 },
];

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
  return `${formatted} UTC`;
}

// Cells are fixed-width columns — a long email/action must not run into the
// next column, so it's ellipsized to fit rather than overflowing.
function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) {
    return text;
  }
  const ellipsis = "…";
  let result = text;
  while (result.length > 0 && font.widthOfTextAtSize(result + ellipsis, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return result.length > 0 ? result + ellipsis : ellipsis;
}

export interface AuditLogExportOptions {
  entries: AuditLogRecord[];
  total: number;
}

// entries is the (possibly already-capped) page of rows to render; total is
// the true count matching the filters, used only to decide whether to print
// the "showing first N of total" note — the cap itself is enforced by the
// caller (the /api/audit-log/export route), not here.
export async function generateAuditLogPdf({ entries, total }: AuditLogExportOptions): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = await drawBrandedHeader(pdfDoc, page, {
    margin: MARGIN,
    pageHeight: PAGE_HEIGHT,
    boldFont,
  });

  function ensureSpace() {
    if (y < MARGIN + ROW_HEIGHT) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function drawRow(values: string[], useFont: PDFFont) {
    ensureSpace();
    let x = MARGIN;
    for (let i = 0; i < COLUMNS.length; i++) {
      const column = COLUMNS[i];
      const value = values[i] ?? "";
      const text = truncateToWidth(value, useFont, TABLE_FONT_SIZE, column.width - 6);
      // drawText is pdf-lib's safe text-insertion API — every value here
      // (user_email is a snapshot the actor's own tenant supplied, action/
      // ip_address are similarly not fully trusted) is rendered as inert
      // glyphs, never interpreted as PDF syntax (SDD §7.2), same guarantee
      // D1's report export already relies on for narrative section text.
      page.drawText(text, { x, y, size: TABLE_FONT_SIZE, font: useFont, color: rgb(0, 0, 0) });
      x += column.width;
    }
    y -= ROW_HEIGHT;
  }

  ensureSpace();
  page.drawText(`Audit log export — ${entries.length} of ${total} matching rows`, {
    x: MARGIN,
    y,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= ROW_HEIGHT * 1.5;

  if (entries.length < total) {
    ensureSpace();
    page.drawText(
      `Showing first ${entries.length} of ${total} matching rows — narrow your filters for a complete export.`,
      { x: MARGIN, y, size: 9, font, color: rgb(0.6, 0.1, 0.1) }
    );
    y -= ROW_HEIGHT * 1.5;
  }

  drawRow(
    COLUMNS.map((c) => c.label),
    boldFont
  );
  y -= 4;

  for (const entry of entries) {
    drawRow(
      [
        formatTimestamp(entry.created_at),
        entry.user_email,
        entry.action,
        `${entry.target_type} #${entry.target_id}`,
        entry.ip_address ?? "—",
      ],
      font
    );
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
