import { describe, expect, it } from "vitest";
import { buildAuditLogListQuery, parseAuditLogFilters } from "./auditLogListQuery";

describe("parseAuditLogFilters", () => {
  it("returns all filters undefined when nothing is supplied", () => {
    expect(parseAuditLogFilters({})).toEqual({
      ok: true,
      userEmail: undefined,
      action: undefined,
      targetType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  });

  it("accepts a valid action from the AuditAction union", () => {
    const result = parseAuditLogFilters({ action: "report.finalized" });
    expect(result).toEqual(expect.objectContaining({ ok: true, action: "report.finalized" }));
  });

  it("rejects an action outside the AuditAction union", () => {
    const result = parseAuditLogFilters({ action: "report.deleted_forever" });
    expect(result.ok).toBe(false);
    expect((result as { field: string }).field).toBe("action");
  });

  it("accepts a valid targetType", () => {
    const result = parseAuditLogFilters({ targetType: "Vendor" });
    expect(result).toEqual(expect.objectContaining({ ok: true, targetType: "Vendor" }));
  });

  it("rejects a targetType outside the AuditTargetType union", () => {
    const result = parseAuditLogFilters({ targetType: "Invoice" });
    expect(result.ok).toBe(false);
    expect((result as { field: string }).field).toBe("targetType");
  });

  it("accepts well-formed ISO dates for dateFrom/dateTo", () => {
    const result = parseAuditLogFilters({ dateFrom: "2026-01-01", dateTo: "2026-03-31" });
    expect(result).toEqual(
      expect.objectContaining({ ok: true, dateFrom: "2026-01-01", dateTo: "2026-03-31" })
    );
  });

  it("rejects a malformed dateFrom", () => {
    const result = parseAuditLogFilters({ dateFrom: "01/01/2026" });
    expect(result.ok).toBe(false);
    expect((result as { field: string }).field).toBe("dateFrom");
  });

  it("rejects a malformed dateTo", () => {
    const result = parseAuditLogFilters({ dateTo: "not-a-date" });
    expect(result.ok).toBe(false);
    expect((result as { field: string }).field).toBe("dateTo");
  });

  it("trims and passes through a userEmail partial match", () => {
    const result = parseAuditLogFilters({ userEmail: "  someone@envirosgroup.com  " });
    expect(result).toEqual(expect.objectContaining({ ok: true, userEmail: "someone@envirosgroup.com" }));
  });
});

describe("buildAuditLogListQuery", () => {
  it("filters by userEmail with a parameterized LIKE pattern", () => {
    const query = buildAuditLogListQuery({ userEmail: "someone@envirosgroup.com" });
    expect(query.whereClause).toBe("WHERE user_email LIKE @userEmail");
    expect(query.whereClause).not.toContain("someone@envirosgroup.com");
    expect(query.bindings).toEqual([{ name: "userEmail", value: "%someone@envirosgroup.com%" }]);
  });

  it("escapes LIKE wildcards inside the bound userEmail value", () => {
    const query = buildAuditLogListQuery({ userEmail: "100%_admin" });
    expect(query.bindings[0]?.value).toBe("%100[%][_]admin%");
  });

  it("filters by exact action match with a bound parameter", () => {
    const query = buildAuditLogListQuery({ action: "vendor.deleted" });
    expect(query.whereClause).toBe("WHERE action = @action");
    expect(query.bindings).toEqual([{ name: "action", value: "vendor.deleted" }]);
  });

  it("filters by exact targetType match with a bound parameter", () => {
    const query = buildAuditLogListQuery({ targetType: "Transaction" });
    expect(query.whereClause).toBe("WHERE target_type = @targetType");
    expect(query.bindings).toEqual([{ name: "targetType", value: "Transaction" }]);
  });

  it("filters by an inclusive date range on created_at", () => {
    const query = buildAuditLogListQuery({ dateFrom: "2026-01-01", dateTo: "2026-03-31" });
    expect(query.whereClause).toBe(
      "WHERE created_at >= @dateFrom AND created_at < DATEADD(day, 1, @dateTo)"
    );
    expect(query.bindings).toEqual([
      { name: "dateFrom", value: "2026-01-01" },
      { name: "dateTo", value: "2026-03-31" },
    ]);
  });

  it("combines every filter together with AND", () => {
    const query = buildAuditLogListQuery({
      userEmail: "someone@envirosgroup.com",
      action: "report.edited",
      targetType: "Report",
      dateFrom: "2026-01-01",
      dateTo: "2026-03-31",
    });
    expect(query.whereClause).toBe(
      "WHERE user_email LIKE @userEmail AND action = @action AND target_type = @targetType AND created_at >= @dateFrom AND created_at < DATEADD(day, 1, @dateTo)"
    );
    expect(query.bindings).toHaveLength(5);
  });

  it("returns an empty whereClause when no filters are supplied", () => {
    const query = buildAuditLogListQuery({});
    expect(query.whereClause).toBe("");
    expect(query.bindings).toEqual([]);
  });
});
