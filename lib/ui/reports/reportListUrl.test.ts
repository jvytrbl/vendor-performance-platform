import { describe, expect, it } from "vitest";
import { parseReportListView, reportListSearchParams, withReportListFilterChange } from "./reportListUrl";

const view = {
  status: "Finalized" as const,
  search: "VPR-2026",
  sortBy: "createdAt" as const,
  sortOrder: "desc" as const,
  page: 3,
};

describe("withReportListFilterChange", () => {
  it("resets to page 1 when the status filter changes", () => {
    expect(withReportListFilterChange(view, { status: "Draft" }).page).toBe(1);
  });

  it("resets to page 1 when the search changes", () => {
    expect(withReportListFilterChange(view, { search: "VPR-2025" }).page).toBe(1);
  });

  it("resets to page 1 when the sort changes", () => {
    expect(
      withReportListFilterChange(view, { sortBy: "periodStart", sortOrder: "asc" }).page
    ).toBe(1);
  });

  it("keeps the filter values that were not changed", () => {
    expect(withReportListFilterChange(view, { status: undefined })).toMatchObject({
      search: "VPR-2026",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
    });
  });
});

describe("reportListSearchParams", () => {
  it("writes status, search, sort, and page into the query string", () => {
    const params = new URLSearchParams(reportListSearchParams(view));
    expect(params.get("status")).toBe("Finalized");
    expect(params.get("search")).toBe("VPR-2026");
    expect(params.get("sortBy")).toBe("createdAt");
    expect(params.get("sortOrder")).toBe("desc");
    expect(params.get("page")).toBe("3");
  });

  it("omits status when the filter is All", () => {
    const params = new URLSearchParams(
      reportListSearchParams({ ...view, status: undefined, page: 1 })
    );
    expect(params.has("status")).toBe(false);
  });
});

describe("parseReportListView", () => {
  it("reads the same view back from the query string", () => {
    expect(parseReportListView(new URLSearchParams(reportListSearchParams(view)))).toEqual(view);
  });
});
