import { describe, it, expect, vi } from "vitest";
import { listAuditLog } from "./auditLog";
import { getDbPool } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  getDbPool: vi.fn(),
}));

describe("listAuditLog", () => {
  it("returns one page and the total, ordered newest-first", async () => {
    const entryRow = {
      id: 42,
      user_email: "someone@envirosgroup.com",
      user_oid: "11111111-1111-1111-1111-111111111111",
      user_tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
      action: "report.created",
      target_type: "Report",
      target_id: 7,
      ip_address: "203.0.113.5",
      created_at: "2026-04-01T14:30:00.000Z",
    };

    const request: any = {};
    request.input = vi.fn().mockReturnValue(request);
    request.query = vi
      .fn()
      .mockResolvedValueOnce({ recordset: [{ total: 1 }] })
      .mockResolvedValueOnce({ recordset: [entryRow] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    const result = await listAuditLog({ limit: 25, offset: 0 });

    expect(request.input).toHaveBeenCalledWith("offset", 0);
    expect(request.input).toHaveBeenCalledWith("limit", 25);
    expect(request.query.mock.calls[1][0]).toContain("ORDER BY created_at DESC");
    expect(request.query.mock.calls[1][0]).toContain("OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY");
    expect(result).toEqual({ entries: [entryRow], total: 1 });
  });

  it("binds every filter and does not place them in the SQL text", async () => {
    const request: any = {};
    request.input = vi.fn().mockReturnValue(request);
    request.query = vi
      .fn()
      .mockResolvedValueOnce({ recordset: [{ total: 0 }] })
      .mockResolvedValueOnce({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    await listAuditLog({
      limit: 25,
      offset: 0,
      userEmail: "someone@envirosgroup.com",
      action: "vendor.deleted",
      targetType: "Vendor",
      dateFrom: "2026-01-01",
      dateTo: "2026-03-31",
    });

    const countSql = request.query.mock.calls[0][0] as string;
    const pageSql = request.query.mock.calls[1][0] as string;
    expect(countSql).toContain(
      "WHERE user_email LIKE @userEmail AND action = @action AND target_type = @targetType AND created_at >= @dateFrom AND created_at < DATEADD(day, 1, @dateTo)"
    );
    expect(pageSql).toContain("ORDER BY created_at DESC");
    expect(countSql).not.toContain("someone@envirosgroup.com");
    expect(request.input).toHaveBeenCalledWith("userEmail", "%someone@envirosgroup.com%");
    expect(request.input).toHaveBeenCalledWith("action", "vendor.deleted");
    expect(request.input).toHaveBeenCalledWith("targetType", "Vendor");
    expect(request.input).toHaveBeenCalledWith("dateFrom", "2026-01-01");
    expect(request.input).toHaveBeenCalledWith("dateTo", "2026-03-31");
  });

  it("returns an empty page and total 0 when nothing matches", async () => {
    const request: any = {};
    request.input = vi.fn().mockReturnValue(request);
    request.query = vi
      .fn()
      .mockResolvedValueOnce({ recordset: [] })
      .mockResolvedValueOnce({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    const result = await listAuditLog({ limit: 25, offset: 0 });

    expect(result).toEqual({ entries: [], total: 0 });
  });
});
