import { validateTransactionInput, type TransactionInput } from "./validateTransactionInput";

export interface RowValidationError {
    row: number;
    error: string;
    code: string;
    field: string;
}

export interface RowValidationResult {
    validRows: { row: number; data: TransactionInput}[];
    errors: RowValidationError[];
}

export function validateUploadRows(rows: TransactionInput[]): RowValidationResult {
    const validRows: { row: number; data: TransactionInput }[] = [];
    const errors: RowValidationError[] = [];
    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const result = validateTransactionInput(row);
      if (result.valid) {
        validRows.push({ row: rowNumber, data: result.data });
      } else {
        errors.push({
          row: rowNumber,
          error: result.error,
          code: result.code,
          field: result.field,
        });
      }
    });
    return { validRows, errors };
  }