const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type FileSizeValidationResult =
  | { valid: true }
  | { valid: false; error: string; code: string; field: string };

export function validateUploadFileSize(fileSizeBytes: number): FileSizeValidationResult {
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "File exceeds the maximum size of 10MB",
      code: "FILE_TOO_LARGE",
      field: "file",
    };
  }

  return { valid: true };
}
