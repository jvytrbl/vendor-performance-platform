import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAuditLogAdmin } from "./isAuditLogAdmin";

describe("isAuditLogAdmin()", () => {
  const original = process.env.AUDIT_LOG_ADMIN_EMAILS;

  beforeEach(() => {
    process.env.AUDIT_LOG_ADMIN_EMAILS = "hakimi.azizi@envirosgroup.com, other.admin@envirosgroup.com";
  });

  afterEach(() => {
    process.env.AUDIT_LOG_ADMIN_EMAILS = original;
  });

  it("returns true for an email on the allow-list", () => {
    expect(isAuditLogAdmin("hakimi.azizi@envirosgroup.com")).toBe(true);
  });

  it("returns true regardless of case, matching ALLOWED_EMAILS' pattern", () => {
    expect(isAuditLogAdmin("HAKIMI.AZIZI@ENVIROSGROUP.COM")).toBe(true);
  });

  it("returns false for an email not on the allow-list", () => {
    expect(isAuditLogAdmin("someone.else@envirosgroup.com")).toBe(false);
  });

  it("returns false for every email when the allow-list is unset (fail closed)", () => {
    delete process.env.AUDIT_LOG_ADMIN_EMAILS;
    expect(isAuditLogAdmin("hakimi.azizi@envirosgroup.com")).toBe(false);
  });

  it("tolerates surrounding whitespace in both the list and the input", () => {
    process.env.AUDIT_LOG_ADMIN_EMAILS = "  hakimi.azizi@envirosgroup.com  ";
    expect(isAuditLogAdmin("  hakimi.azizi@envirosgroup.com  ")).toBe(true);
  });
});
