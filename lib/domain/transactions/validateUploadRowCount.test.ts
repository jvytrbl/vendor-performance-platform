import { describe, it, expect } from "vitest";
import { validateUploadRowCount } from "./validateUploadRowCount";

describe("validateUploadRowCount", () => {
  it("accepts exactly 50,000 rows", () => {
    expect(validateUploadRowCount(50000)).toEqual({ valid: true });
  });

  it("accepts well under the limit", () => {
    expect(validateUploadRowCount(10)).toEqual({ valid: true });
  });

  it("rejects 50,001 rows", () => {
    const result = validateUploadRowCount(50001);

    expect(result).toEqual({
      valid: false,
      error: "File exceeds the maximum of 50000 rows",
      code: "TOO_MANY_ROWS",
      field: "file",
    });
  });
});
