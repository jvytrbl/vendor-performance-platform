import { describe, expect, it } from "vitest";
import { buildReportListQuery, parseReportListFilters } from "./reportListQuery";

describe("parseReportListFilters", () => {
  it("defaults to newest created date when sort is omitted", () => {
    expect(parseReportListFilters({})).toEqual({
      ok: true,
      status: undefined,
      search: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  });

  it("rejects a status outside Draft and Finalized", () => {
    expect(parseReportListFilters({ status: "Archived" })).toEqual({
      ok: false,
      field: "status",
      error: "status must be Draft or Finalized",
    });
  });
});

describe("buildReportListQuery", () => {
  it("filters by status with a bound parameter", () => {
    const query = buildReportListQuery({ status: "Finalized" });
    expect(query.whereClause).toBe("WHERE status = @status");
    expect(query.bindings).toEqual([{ name: "status", value: "Finalized" }]);
  });

  it("searches the reference with a parameterized LIKE pattern", () => {
    const query = buildReportListQuery({ search: "VPR-2026" });
    expect(query.whereClause).toBe("WHERE reference_number LIKE @search");
    expect(query.whereClause).not.toContain("VPR-2026");
    expect(query.bindings).toEqual([{ name: "search", value: "%VPR-2026%" }]);
  });

  it("escapes LIKE wildcards inside the bound search value", () => {
    const query = buildReportListQuery({ search: "100%" });
    expect(query.whereClause).not.toContain("100%");
    expect(query.bindings[0]?.value).toBe("%100[%]%");
  });

  it("sorts period start and created date without taking the column from user text", () => {
    expect(buildReportListQuery({ sortBy: "periodStart", sortOrder: "asc" }).orderByClause).toBe(
      "ORDER BY period_start ASC"
    );
    expect(buildReportListQuery({ sortBy: "createdAt", sortOrder: "desc" }).orderByClause).toBe(
      "ORDER BY created_at DESC"
    );
    expect(buildReportListQuery({}).orderByClause).toBe("ORDER BY created_at DESC");
  });

  it("applies status and search together before the sort", () => {
    const query = buildReportListQuery({
      status: "Draft",
      search: "VPR-2026",
      sortBy: "periodStart",
      sortOrder: "asc",
    });
    expect(query.whereClause).toBe(
      "WHERE status = @status AND reference_number LIKE @search"
    );
    expect(query.orderByClause).toBe("ORDER BY period_start ASC");
  });
});
