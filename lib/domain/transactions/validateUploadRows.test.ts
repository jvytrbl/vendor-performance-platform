import { describe, it, expect } from "vitest";
import { validateUploadRows } from "./validateUploadRows";

const validRow = {
  vendor_id: 1,
  transaction_date: "2026-09-14",
  item_description: "Steel beams",
  agreed_price: 100,
  agreed_delivery_date: "2026-09-20",
  quantity_ordered: 10,
};

describe("validateUploadRows", () => {
  it("returns an empty result when there are no rows to process", () => {
    const result = validateUploadRows([]);
    expect(result).toEqual({ validRows: [], errors: [] });
  });

  it("collects every row as valid when all rows are correct", () => {
    const result = validateUploadRows([validRow, { ...validRow, vendor_id: 2 }]);

    expect(result.errors).toEqual([]);
    expect(result.validRows).toEqual([
      { row: 2, data: validRow },
      { row: 3, data: { ...validRow, vendor_id: 2 } },
    ]);
  });

  it("reports every row as an error, with correct row numbers, when all rows are invalid", () => {
    const result = validateUploadRows([
      { ...validRow, item_description: "" },
      { ...validRow, agreed_price: -5 },
    ]);

    expect(result.validRows).toEqual([]);
    expect(result.errors).toEqual([
      { row: 2, error: "Item description is required", code: "VALIDATION_FAILED", field: "item_description" },
      { row: 3, error: "Agreed price must be greater than 0", code: "VALIDATION_FAILED", field: "agreed_price" },
    ]);
  });

  it("keeps valid rows and reports bad ones individually, preserving original row numbers, when the file is mixed", () => {
    const result = validateUploadRows([
      validRow,
      { ...validRow, item_description: "" },
      { ...validRow, vendor_id: 3 },
    ]);

    expect(result.validRows).toEqual([
      { row: 2, data: validRow },
      { row: 4, data: { ...validRow, vendor_id: 3 } },
    ]);
    expect(result.errors).toEqual([
      { row: 3, error: "Item description is required", code: "VALIDATION_FAILED", field: "item_description" },
    ]);
  });
});
