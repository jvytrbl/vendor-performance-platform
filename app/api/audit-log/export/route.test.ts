import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { GET } from "./route";
import { validateAuthHeader } from "@/lib/auth";
import { listAuditLog } from "@/lib/repositories/auditLog";
import { generateAuditLogPdf } from "@/lib/exports/generateAuditLogPdf";

vi.mock("@/lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/auditLog", () => ({
  listAuditLog: vi.fn(),
}));

vi.mock("@/lib/exports/generateAuditLogPdf", () => ({
  generateAuditLogPdf: vi.fn(),
}));

const ADMIN_EMAIL = "hakimi.azizi@envirosgroup.com";
const NON_ADMIN_EMAIL = "someone.else@envirosgroup.com";

function mockAuth(email: string) {
  vi.mocked(validateAuthHeader).mockResolvedValue({
    valid: true,
    email,
    oid: "11111111-1111-1111-1111-111111111111",
    tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
  });
}

function buildRequest(query = ""): Request {
  return new Request(`http://localhost/api/audit-log/export${query}`, {
    headers: { Authorization: "Bearer good.token" },
  });
}

const sampleEntry = {
  id: 1,
  user_email: ADMIN_EMAIL,
  user_oid: "oid",
  user_tid: "tid",
  action: "report.created" as const,
  target_type: "Report" as const,
  target_id: 7,
  ip_address: null,
  created_at: "2026-04-01T00:00:00.000Z",
};

describe("GET /api/audit-log/export", () => {
  const originalAdminEmails = process.env.AUDIT_LOG_ADMIN_EMAILS;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUDIT_LOG_ADMIN_EMAILS = ADMIN_EMAIL;
    vi.mocked(listAuditLog).mockResolvedValue({ entries: [sampleEntry], total: 1 });
    vi.mocked(generateAuditLogPdf).mockResolvedValue(Buffer.from("%PDF-fake"));
  });

  afterAll(() => {
    process.env.AUDIT_LOG_ADMIN_EMAILS = originalAdminEmails;
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Invalid or Expired token", code: "UNAUTHORIZED" });
    expect(listAuditLog).not.toHaveBeenCalled();
    expect(generateAuditLogPdf).not.toHaveBeenCalled();
  });

  it("returns 403 for an authenticated user who is not an admin", async () => {
    mockAuth(NON_ADMIN_EMAIL);

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "You do not have access to the audit log", code: "FORBIDDEN" });
    expect(listAuditLog).not.toHaveBeenCalled();
    expect(generateAuditLogPdf).not.toHaveBeenCalled();
  });

  it("returns a PDF file with the correct content type for an admin", async () => {
    mockAuth(ADMIN_EMAIL);
    const pdfBuffer = Buffer.from("%PDF-fake-content");
    vi.mocked(generateAuditLogPdf).mockResolvedValue(pdfBuffer);

    const response = await GET(buildRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("audit-log-export.pdf");
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.equals(pdfBuffer)).toBe(true);
  });

  it("fetches up to the 5,000-row cap, not just the on-screen page size", async () => {
    mockAuth(ADMIN_EMAIL);

    await GET(buildRequest());

    expect(listAuditLog).toHaveBeenCalledWith(expect.objectContaining({ limit: 5000, offset: 0 }));
  });

  it("passes every filter through to listAuditLog, same as the main route", async () => {
    mockAuth(ADMIN_EMAIL);

    await GET(
      buildRequest(
        "?userEmail=someone@envirosgroup.com&action=vendor.deleted&targetType=Vendor&dateFrom=2026-01-01&dateTo=2026-03-31"
      )
    );

    expect(listAuditLog).toHaveBeenCalledWith({
      limit: 5000,
      offset: 0,
      userEmail: "someone@envirosgroup.com",
      action: "vendor.deleted",
      targetType: "Vendor",
      dateFrom: "2026-01-01",
      dateTo: "2026-03-31",
    });
  });

  it("rejects an action outside the AuditAction union before calling listAuditLog", async () => {
    mockAuth(ADMIN_EMAIL);

    const response = await GET(buildRequest("?action=not-a-real-action"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.field).toBe("action");
    expect(listAuditLog).not.toHaveBeenCalled();
  });

  it("passes entries and the true total through to generateAuditLogPdf, including the excluded (filtered-out) rows' absence", async () => {
    mockAuth(ADMIN_EMAIL);
    const matchingEntry = { ...sampleEntry, id: 1, action: "vendor.deleted" as const };
    // listAuditLog itself is responsible for filtering (already covered by
    // its own repository tests) — this test only proves the route passes
    // whatever listAuditLog returns straight through, unfiltered again.
    vi.mocked(listAuditLog).mockResolvedValue({ entries: [matchingEntry], total: 1 });

    await GET(buildRequest("?action=vendor.deleted"));

    expect(generateAuditLogPdf).toHaveBeenCalledWith({ entries: [matchingEntry], total: 1 });
  });

  it("still produces a PDF (calls generateAuditLogPdf with an empty array) when nothing matches", async () => {
    mockAuth(ADMIN_EMAIL);
    vi.mocked(listAuditLog).mockResolvedValue({ entries: [], total: 0 });

    const response = await GET(buildRequest());

    expect(response.status).toBe(200);
    expect(generateAuditLogPdf).toHaveBeenCalledWith({ entries: [], total: 0 });
  });

  it("passes total > cap through when the filtered result exceeds 5,000 rows, for the PDF's own truncation note", async () => {
    mockAuth(ADMIN_EMAIL);
    const cappedEntries = Array.from({ length: 5000 }, (_, i) => ({ ...sampleEntry, id: i + 1 }));
    vi.mocked(listAuditLog).mockResolvedValue({ entries: cappedEntries, total: 7342 });

    await GET(buildRequest());

    expect(generateAuditLogPdf).toHaveBeenCalledWith({ entries: cappedEntries, total: 7342 });
  });
});
