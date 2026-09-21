import { describe, it, expect } from "vitest";
import { validateUploadFileSize } from "./validateUploadFileSize";

const TEN_MB = 10 * 1024 * 1024;

describe("validateUploadFileSize", () => {
  it("accepts a file exactly at the 10MB limit", () => {
    expect(validateUploadFileSize(TEN_MB)).toEqual({ valid: true });
  });

  it("accepts a file well under the limit", () => {
    expect(validateUploadFileSize(1024)).toEqual({ valid: true });
  });

  it("rejects a file one byte over the 10MB limit", () => {
    const result = validateUploadFileSize(TEN_MB + 1);

    expect(result).toEqual({
      valid: false,
      error: "File exceeds the maximum size of 10MB",
      code: "FILE_TOO_LARGE",
      field: "file",
    });
  });
});
