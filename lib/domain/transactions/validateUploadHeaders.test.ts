import { describe, it, expect } from "vitest";
import { validateUploadHeaders } from "./validateUploadHeaders";

const requiredHeaders = [
  "vendor_name",
  "transaction_date",
  "item_description",
  "agreed_price",
  "agreed_delivery_date",
  "quantity_ordered",
];

describe("validateUploadHeaders", () => {
  it("accepts a file with exactly the required columns", () => {
    const result = validateUploadHeaders(requiredHeaders);
    expect(result).toEqual({ valid: true });
  });

  it("accepts a file with the required columns plus extra unknown columns", () => {
    const result = validateUploadHeaders([...requiredHeaders, "notes", "internal_ref"]);
    expect(result).toEqual({ valid: true });
  });

  it("rejects a file missing one required column", () => {
    const headers = requiredHeaders.filter((h) => h !== "agreed_price");
    const result = validateUploadHeaders(headers);

    expect(result).toEqual({
      valid: false,
      error: "Missing required column(s): agreed_price",
      code: "MISSING_COLUMNS",
      field: "headers",
    });
  });

  it("rejects a file missing multiple required columns, listing all of them", () => {
    const headers = requiredHeaders.filter(
      (h) => h !== "agreed_price" && h !== "quantity_ordered"
    );
    const result = validateUploadHeaders(headers);

    expect(result).toEqual({
      valid: false,
      error: "Missing required column(s): agreed_price, quantity_ordered",
      code: "MISSING_COLUMNS",
      field: "headers",
    });
  });

  it("rejects a file with a duplicated column header", () => {
    const headers = [...requiredHeaders, "vendor_name"];
    const result = validateUploadHeaders(headers);

    expect(result).toEqual({
      valid: false,
      error: "Duplicate column header(s): vendor_name",
      code: "DUPLICATE_COLUMNS",
      field: "headers",
    });
  });

  it("accepts headers regardless of casing", () => {
    const result = validateUploadHeaders([
      "Vendor_Name",
      "Transaction_Date",
      "ITEM_DESCRIPTION",
      "agreed_price",
      "Agreed_Delivery_Date",
      "quantity_ordered",
    ]);
    expect(result).toEqual({ valid: true });
  });
  
  it("accepts headers with leading or trailing whitespace", () => {
    const result = validateUploadHeaders([
      " vendor_name",
      "transaction_date ",
      " item_description ",
      "agreed_price",
      "agreed_delivery_date",
      "quantity_ordered",
    ]);
    expect(result).toEqual({ valid: true });
  });
  
  it("reports every required column as missing when the header row is empty", () => {
    const result = validateUploadHeaders([]);
  
    expect(result).toEqual({
      valid: false,
      error:
        "Missing required column(s): vendor_name, transaction_date, item_description, agreed_price, agreed_delivery_date, quantity_ordered",
      code: "MISSING_COLUMNS",
      field: "headers",
    });
  });
  
  it("treats case-variant duplicates as duplicates too", () => {
    const headers = [...requiredHeaders, "Vendor_Name"];
    const result = validateUploadHeaders(headers);
  
    expect(result).toEqual({
      valid: false,
      error: "Duplicate column header(s): vendor_name",
      code: "DUPLICATE_COLUMNS",
      field: "headers",
    });
  });
});