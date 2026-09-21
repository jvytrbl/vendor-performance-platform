import { describe, it, expect } from "vitest";
import { getVisibleFieldError } from "./getVisibleFieldError";

describe("getVisibleFieldError", () => {
  it("returns null when the overall validation is valid", () => {
    const result = getVisibleFieldError("name", new Set(["name"]), { valid: true });
    expect(result).toBeNull();
  });

  it("returns null when the field hasn't been touched yet, even if it's the invalid one", () => {
    const result = getVisibleFieldError("name", new Set(), {
      valid: false,
      error: "Vendor name is required",
      field: "name",
    });
    expect(result).toBeNull();
  });

  it("returns null when the invalid field is a different field than the one being asked about", () => {
    const result = getVisibleFieldError("contact_info", new Set(["contact_info"]), {
      valid: false,
      error: "Vendor name is required",
      field: "name",
    });
    expect(result).toBeNull();
  });

  it("returns the error message when the field is touched and matches the invalid field", () => {
    const result = getVisibleFieldError("name", new Set(["name"]), {
      valid: false,
      error: "Vendor name is required",
      field: "name",
    });
    expect(result).toBe("Vendor name is required");
  });
});
