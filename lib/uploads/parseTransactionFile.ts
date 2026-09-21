import ExcelJS from "exceljs";
import { Readable } from "stream";

export interface ParsedFile {
  headers: string[];
  rows: Record<string, unknown>[];
}

export async function parseTransactionFile(
  buffer: Buffer,
  filename: string
): Promise<ParsedFile> {
  const workbook = new ExcelJS.Workbook();
  const isCsv = filename.toLowerCase().endsWith(".csv");

  const worksheet = isCsv
    ? await workbook.csv.read(Readable.from(buffer))
    : (await workbook.xlsx.load(buffer as any)).worksheets[0];

  if (!worksheet || worksheet.rowCount === 0) {
    return { headers: [], rows: [] };
  }

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    headers.push(String(cell.value));
  });

  const rows: Record<string, unknown>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowObject: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        rowObject[header] =
            cell.value instanceof Date
            ? cell.value.toISOString().slice(0, 10)
            :  cell.value;
      }
    });
    rows.push(rowObject);
  });

  return { headers, rows };
}