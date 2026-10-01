import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { GET } from "./route";
import { validateAuthHeader } from "@/lib/auth";
import { listAuditLog } from "@/lib/repositories/auditLog";

vi.mock("@/lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/auditLog", () => ({
  listAuditLog: vi.fn(),
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
  return new Request(`http://localhost/api/audit-log${query}`, {
    headers: { Authorization: "Bearer good.token" },
  });
}

describe("GET /api/audit-log", () => {
  const originalAdminEmails = process.env.AUDIT_LOG_ADMIN_EMAILS;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUDIT_LOG_ADMIN_EMAILS = ADMIN_EMAIL;
    vi.mocked(listAuditLog).mockResolvedValue({ entries: [], total: 0 });
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
  });

  it("returns 403 for an authenticated user who is not an admin", async () => {
    mockAuth(NON_ADMIN_EMAIL);

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      error: "You do not have access to the audit log",
      code: "FORBIDDEN",
    });
    expect(listAuditLog).not.toHaveBeenCalled();
  });

  it("returns 200 with entries and total for an admin", async () => {
    mockAuth(ADMIN_EMAIL);
    vi.mocked(listAuditLog).mockResolvedValue({
      entries: [
        {
          id: 1,
          user_email: ADMIN_EMAIL,
          user_oid: "oid",
          user_tid: "tid",
          action: "report.created",
          target_type: "Report",
          target_id: 7,
          ip_address: null,
          created_at: "2026-04-01T00:00:00.000Z",
        },
      ],
      total: 1,
    });

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.entries).toHaveLength(1);
  });

  it("applies default pagination (page 1, pageSize 25) when none is given", async () => {
    mockAuth(ADMIN_EMAIL);

    await GET(buildRequest());

    expect(listAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, offset: 0 })
    );
  });

  it("computes offset correctly for page 3 with a custom pageSize", async () => {
    mockAuth(ADMIN_EMAIL);

    await GET(buildRequest("?page=3&pageSize=10"));

    expect(listAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 })
    );
  });

  it("rejects a pageSize above the audit log's max of 100", async () => {
    mockAuth(ADMIN_EMAIL);

    const response = await GET(buildRequest("?pageSize=101"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.field).toBe("pageSize");
    expect(listAuditLog).not.toHaveBeenCalled();
  });

  it("passes the userEmail filter through individually", async () => {
    mockAuth(ADMIN_EMAIL);

    await GET(buildRequest("?userEmail=someone@envirosgroup.com"));

    expect(listAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: "someone@envirosgroup.com" })
    );
  });

  it("passes the action filter through individually", async () => {
    mockAuth(ADMIN_EMAIL);

    await GET(buildRequest("?action=report.finalized"));

    expect(listAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "report.finalized" })
    );
  });

  it("rejects an action outside the AuditAction union", async () => {
    mockAuth(ADMIN_EMAIL);

    const response = await GET(buildRequest("?action=not-a-real-action"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.field).toBe("action");
    expect(listAuditLog).not.toHaveBeenCalled();
  });

  it("passes the targetType filter through individually", async () => {
    mockAuth(ADMIN_EMAIL);

    await GET(buildRequest("?targetType=Vendor"));

    expect(listAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: "Vendor" })
    );
  });

  it("passes dateFrom/dateTo through individually", async () => {
    mockAuth(ADMIN_EMAIL);

    await GET(buildRequest("?dateFrom=2026-01-01&dateTo=2026-03-31"));

    expect(listAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: "2026-01-01", dateTo: "2026-03-31" })
    );
  });

  it("combines every filter together in a single call", async () => {
    mockAuth(ADMIN_EMAIL);

    await GET(
      buildRequest(
        "?userEmail=someone@envirosgroup.com&action=transaction.edited&targetType=Transaction&dateFrom=2026-01-01&dateTo=2026-03-31&page=2&pageSize=10"
      )
    );

    expect(listAuditLog).toHaveBeenCalledWith({
      limit: 10,
      offset: 10,
      userEmail: "someone@envirosgroup.com",
      action: "transaction.edited",
      targetType: "Transaction",
      dateFrom: "2026-01-01",
      dateTo: "2026-03-31",
    });
  });
});
