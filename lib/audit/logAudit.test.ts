import { describe, it, expect, vi } from "vitest";
import { logAudit } from "./logAudit";

function makeExecutor() {
  const request: any = {};
  request.input = vi.fn().mockReturnValue(request);
  request.query = vi.fn().mockResolvedValue({});
  return { executor: { request: vi.fn(() => request) } as any, request };
}

describe("logAudit()", () => {
  const validEntry = {
    userEmail: "someone@envirosgroup.com",
    userOid: "11111111-1111-1111-1111-111111111111",
    userTid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    action: "report.edited" as const,
    targetType: "Report" as const,
    targetId: 7,
    ipAddress: "203.0.113.5",
  };

  it("inserts one AUDIT_LOG row with the given identity, action, target, and ip", async () => {
    const { executor, request } = makeExecutor();

    await logAudit(executor, validEntry);

    expect(request.input).toHaveBeenCalledWith("user_oid", validEntry.userOid);
    expect(request.input).toHaveBeenCalledWith("user_tid", validEntry.userTid);
    expect(request.input).toHaveBeenCalledWith("user_email", validEntry.userEmail);
    expect(request.input).toHaveBeenCalledWith("action", "report.edited");
    expect(request.input).toHaveBeenCalledWith("target_type", "Report");
    expect(request.input).toHaveBeenCalledWith("target_id", 7);
    expect(request.input).toHaveBeenCalledWith("ip_address", "203.0.113.5");
    expect(request.query.mock.calls[0][0]).toContain("INSERT INTO AUDIT_LOG");
  });

  it("passes ipAddress through as null rather than omitting it, when unavailable", async () => {
    const { executor, request } = makeExecutor();

    await logAudit(executor, { ...validEntry, ipAddress: null });

    expect(request.input).toHaveBeenCalledWith("ip_address", null);
  });

  it("never supplies a created_at value — that column is DB-generated only", async () => {
    const { executor, request } = makeExecutor();

    await logAudit(executor, validEntry);

    const createdAtCalls = request.input.mock.calls.filter(([name]: [string]) => name === "created_at");
    expect(createdAtCalls).toHaveLength(0);
  });

  // targetId = 0 is legitimately allowed (unlike withAudit's own stricter
  // > 0 check) because the bulk-upload summary row repurposes it as a
  // successful-insert count, which can be 0 on a 100%-failure batch.
  it("accepts targetId = 0, writing the row (bulk-upload's zero-successes case)", async () => {
    const { executor, request } = makeExecutor();

    await logAudit(executor, { ...validEntry, targetId: 0 });

    expect(request.input).toHaveBeenCalledWith("target_id", 0);
    expect(request.query).toHaveBeenCalled();
  });

  it("rejects a negative targetId without writing a row", async () => {
    const { executor, request } = makeExecutor();

    await expect(logAudit(executor, { ...validEntry, targetId: -3 })).rejects.toThrow(
      /non-negative integer/
    );
    expect(request.query).not.toHaveBeenCalled();
  });

  it("rejects a non-integer targetId without writing a row", async () => {
    const { executor, request } = makeExecutor();

    await expect(logAudit(executor, { ...validEntry, targetId: 1.5 })).rejects.toThrow(
      /non-negative integer/
    );
    expect(request.query).not.toHaveBeenCalled();
  });

  // Documents a known, deliberate boundary rather than assuming it's covered:
  // action/target_type are a closed TypeScript union at every real call site
  // (the five route handlers each pass a hardcoded literal), but AUDIT_LOG's
  // action/target_type columns have no DB CHECK constraint (by design, so
  // Phase 2 can widen the union without a migration — see auditTypes.ts).
  // That means an `as AuditAction` cast on external input would reach the
  // database unfiltered; this test proves that gap exists rather than
  // silently trusting the type system covers it. No current code path casts
  // from request input, so this is accepted, not exploitable today.
  it("does not runtime-validate action/target_type — an `as`-cast bypass would reach the query (documented trade-off, not a bug)", async () => {
    const { executor, request } = makeExecutor();

    await logAudit(executor, { ...validEntry, action: "not-a-real-action" as never });

    expect(request.query).toHaveBeenCalled();
  });
});
