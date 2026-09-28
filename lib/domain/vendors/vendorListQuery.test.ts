import { describe, expect, it } from "vitest";
import { buildVendorListOrderBy, parseVendorListSort } from "./vendorListQuery";

describe("parseVendorListSort", () => {
  it("keeps the added-date order when sort is omitted", () => {
    expect(parseVendorListSort({})).toEqual({
      ok: true,
      sortBy: undefined,
      sortOrder: "desc",
    });
  });

  it("accepts a transaction-count sort", () => {
    expect(parseVendorListSort({ sortBy: "transactionCount", sortOrder: "asc" })).toEqual({
      ok: true,
      sortBy: "transactionCount",
      sortOrder: "asc",
    });
  });

  it("rejects a sort column outside the whitelist", () => {
    expect(parseVendorListSort({ sortBy: "name" })).toEqual({
      ok: false,
      field: "sortBy",
      error: "sortBy must be transactionCount",
    });
  });

  it("rejects a sort direction outside asc and desc", () => {
    expect(parseVendorListSort({ sortBy: "transactionCount", sortOrder: "newest" })).toEqual({
      ok: false,
      field: "sortOrder",
      error: "sortOrder must be asc or desc",
    });
  });
});

describe("buildVendorListOrderBy", () => {
  it("orders by added date when the count sort is not selected", () => {
    expect(buildVendorListOrderBy({})).toBe("ORDER BY v.created_at DESC");
  });

  it("orders by the whitelisted count column and breaks ties by added date", () => {
    expect(
      buildVendorListOrderBy({ sortBy: "transactionCount", sortOrder: "asc" })
    ).toBe("ORDER BY transaction_count ASC, v.created_at DESC");
    expect(
      buildVendorListOrderBy({ sortBy: "transactionCount", sortOrder: "desc" })
    ).toBe("ORDER BY transaction_count DESC, v.created_at DESC");
  });
});
