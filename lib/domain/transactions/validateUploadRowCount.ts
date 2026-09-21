const MAX_UPLOAD_ROWS = 50_000;

export type RowCountValidationResult =
  | { valid: true }
  | { valid: false; error: string; code: string; field: string };

export function validateUploadRowCount(rowCount: number): RowCountValidationResult {
  if (rowCount > MAX_UPLOAD_ROWS) {
    return {
      valid: false,
      error: `File exceeds the maximum of ${MAX_UPLOAD_ROWS} rows`,
      code: "TOO_MANY_ROWS",
      field: "file",
    };
  }

  return { valid: true };
}
