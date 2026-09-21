import { describe, it, expect } from "vitest";
import { resolveDeleteFailureMessage } from "./resolveDeleteFailureMessage";

describe("resolveDeleteFailureMessage", () => {
  it("returns a session-expired message when the code is UNAUTHORIZED", () => {
    const message = resolveDeleteFailureMessage(
      "UNAUTHORIZED",
      "Invalid or Expired token"
    );
    expect(message).toBe("Your session has expired. Please sign in again.");
  });

  it("passes through the API's own message for other error codes", () => {
    expect(
      resolveDeleteFailureMessage(
        "VENDOR_REFERENCED",
        "Vendor cannot be deleted as it is referenced by an exisiting transaction"
      )
    ).toBe("Vendor cannot be deleted as it is referenced by an exisiting transaction");

    expect(resolveDeleteFailureMessage("VENDOR_NOT_FOUND", "Vendor not found")).toBe(
      "Vendor not found"
    );

    expect(
      resolveDeleteFailureMessage("INTERNAL_ERROR", "Failed to delete vendor")
    ).toBe("Failed to delete vendor");
  });
});