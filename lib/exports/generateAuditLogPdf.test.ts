import { describe, it, expect } from "vitest";
import zlib from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { generateAuditLogPdf } from "./generateAuditLogPdf";
import type { AuditLogRecord } from "@/lib/repositories/auditLog";

// pdf-lib Flate-compresses content streams on save, so a plain raw-byte
// substring search never finds drawn text (see the hostile-input test's own
// comment on this) — and even after inflating, drawText emits text as PDF
// hex strings (`<53686F77...>` in Tj operators), not literal parenthesized
// strings, so the text itself needs a second decode pass.
function extractDecodedText(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const streamHeader = /<<([^>]*?)>>\s*stream\r?\n/g;
  let match: RegExpExecArray | null;
  let inflated = "";
  while ((match = streamHeader.exec(raw)) !== null) {
    if (!/\/Filter\s*\/FlateDecode/.test(match[1])) continue;
    const start = match.index + match[0].length;
    const end = raw.indexOf("endstream", start);
    if (end === -1) continue;
    const streamBody = raw.slice(start, end).replace(/[\r\n]+$/, "");
    try {
      inflated += zlib.inflateSync(Buffer.from(streamBody, "latin1")).toString("latin1");
    } catch {
      // Not a valid standalone zlib stream at this boundary — skip it.
    }
  }

  let decodedText = "";
  const hexString = /<([0-9A-Fa-f]+)>/g;
  let hexMatch: RegExpExecArray | null;
  while ((hexMatch = hexString.exec(inflated)) !== null) {
    if (hexMatch[1].length % 2 !== 0) continue;
    decodedText += Buffer.from(hexMatch[1], "hex").toString("latin1") + " ";
  }
  return decodedText;
}

function makeEntry(overrides: Partial<AuditLogRecord> = {}): AuditLogRecord {
  return {
    id: 1,
    user_email: "someone@envirosgroup.com",
    user_oid: "11111111-1111-1111-1111-111111111111",
    user_tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    action: "report.created",
    target_type: "Report",
    target_id: 7,
    ip_address: "203.0.113.5",
    created_at: "2026-04-01T14:30:00.000Z",
    ...overrides,
  };
}

describe("generateAuditLogPdf", () => {
  it("produces a valid, parseable PDF for a normal set of rows", async () => {
    const buffer = await generateAuditLogPdf({ entries: [makeEntry()], total: 1 });

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  });

  it("embeds the Vantage logo via the shared branding header", async () => {
    const buffer = await generateAuditLogPdf({ entries: [makeEntry()], total: 1 });
    const raw = buffer.toString("latin1");

    expect(raw).toMatch(/\/Subtype\s*\/Image/);
    expect(raw).toMatch(/\/Filter\s*\/DCTDecode/);
  });

  it("produces a valid PDF for an empty result set rather than erroring", async () => {
    const buffer = await generateAuditLogPdf({ entries: [], total: 0 });

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBe(1);
  });

  it("does not print a truncation note when entries.length equals total", async () => {
    const buffer = await generateAuditLogPdf({ entries: [makeEntry(), makeEntry({ id: 2 })], total: 2 });
    expect(extractDecodedText(buffer)).not.toContain("narrow your filters");
  });

  it("prints a truncation note when entries.length is less than total", async () => {
    const buffer = await generateAuditLogPdf({ entries: [makeEntry()], total: 5001 });
    const text = extractDecodedText(buffer);
    expect(text).toContain("Showing first 1 of 5001");
    expect(text).toContain("narrow your filters");
  });

  // Category 8 (security-hostile input), SDD §7.2, same guarantee D1's
  // report export already relies on: PDF string-literal syntax in a
  // user-controlled field (user_email is a snapshot, not re-validated on
  // read) must not corrupt the PDF's structure — drawText escapes it.
  it("stays a valid, parseable PDF when a row's fields contain PDF string-literal syntax", async () => {
    const hostileEntry = makeEntry({
      user_email: 'attacker) /Type /Catalog (injected\\ trailing backslash@evil.com',
      ip_address: '1.2.3.4) (injected',
    });

    const buffer = await generateAuditLogPdf({ entries: [hostileEntry], total: 1 });

    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  });

  it("wraps onto a second page when there are enough rows to overflow the first", async () => {
    const manyEntries = Array.from({ length: 100 }, (_, i) => makeEntry({ id: i + 1 }));
    const buffer = await generateAuditLogPdf({ entries: manyEntries, total: 100 });

    const pdf = await PDFDocument.load(buffer);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
