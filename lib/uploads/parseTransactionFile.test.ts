import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { parseTransactionFile } from "./parseTransactionFile";

describe("parseTransactionFile", () => {
  it("parses a csv buffer into headers and row objects", async () => {
    const csvContent = "vendor_id,item_description\n1,Steel beams\n2,Copper wire\n";
    const buffer = Buffer.from(csvContent, "utf-8");

    const result = await parseTransactionFile(buffer, "upload.csv");

    expect(result.headers).toEqual(["vendor_id", "item_description"]);
    expect(result.rows).toEqual([
      { vendor_id: 1, item_description: "Steel beams" },
      { vendor_id: 2, item_description: "Copper wire" },
    ]);
  });

  it("returns empty headers and rows for a completely empty csv", async () => {
    const buffer = Buffer.from("", "utf-8");
    const result = await parseTransactionFile(buffer, "empty.csv");

    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("parses an xlsx buffer and converts date cells into plain date strings", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sheet1");
    sheet.addRow(["vendor_id", "transaction_date", "item_description"]);
    sheet.addRow([1, new Date("2026-09-14"), "Steel beams"]);
  
    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  
    const result = await parseTransactionFile(buffer, "upload.xlsx");
  
    expect(result.rows[0]).toEqual({
      vendor_id: 1,
      transaction_date: "2026-09-14",
      item_description: "Steel beams",
    });
  });
});