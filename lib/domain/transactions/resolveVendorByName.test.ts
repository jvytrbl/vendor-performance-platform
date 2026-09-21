import { expect, it, describe } from "vitest";
import { resolveVendorByName } from "./resolveVendorByName";

describe("resolveVendorByName()", () => {
  it("resolves immediately on an exact match, bypassing fuzzy scoring even when another vendor would also cross the threshold", () => {
    // "Acme Trding" is a close typo that would ALSO score >=85% against the candidate below
    // (proven in findDuplicateVendor.test.ts) — this test confirms exact match wins outright,
    // instead of the ambiguous-match rejection that would otherwise apply.
    const vendors = [
      { id: 1, name: "Acme Trding" },
      { id: 2, name: "Acme Trading Sdn Bhd" },
    ];

    const result = resolveVendorByName("  ACME trading SDN BHD  ", vendors);

    expect(result).toEqual({ matched: true, vendorId: 2 });
  });

  it("rejects an empty name", () => {
    const result = resolveVendorByName("", [{ id: 1, name: "Acme Trading" }]);

    expect(result).toEqual({
      matched: false,
      error: "Vendor name is required",
      code: "INVALID_VENDOR_NAME",
    });
  });

  it("rejects a whitespace-only name", () => {
    const result = resolveVendorByName("   ", [{ id: 1, name: "Acme Trading" }]);

    expect(result).toEqual({
      matched: false,
      error: "Vendor name is required",
      code: "INVALID_VENDOR_NAME",
    });
  });

  it("rejects a missing (undefined) name", () => {
    const result = resolveVendorByName(undefined, [{ id: 1, name: "Acme Trading" }]);

    expect(result).toEqual({
      matched: false,
      error: "Vendor name is required",
      code: "INVALID_VENDOR_NAME",
    });
  });

  it("rejects a non-string name (e.g. a spreadsheet cell parsed as a number)", () => {
    const result = resolveVendorByName(12345, [{ id: 1, name: "Acme Trading" }]);

    expect(result).toEqual({
      matched: false,
      error: "Vendor name is required",
      code: "INVALID_VENDOR_NAME",
    });
  });

  it("resolves to the single vendor scoring >=85% when there is no exact match", () => {
    const vendors = [{ id: 1, name: "Acme Trading Sdn Bhd" }];

    const result = resolveVendorByName("Acme Trading", vendors);

    expect(result).toEqual({ matched: true, vendorId: 1 });
  });

  it("returns not-found when no vendor scores >=85%", () => {
    const vendors = [{ id: 1, name: "Enviros Group Sdn Bhd" }];

    const result = resolveVendorByName("Acme Trading", vendors);

    expect(result).toEqual({
      matched: false,
      error: 'No vendor found matching "Acme Trading"',
      code: "VENDOR_NOT_FOUND",
    });
  });

  it("rejects as ambiguous when more than one distinct vendor scores >=85%, without picking the best one", () => {
    const vendors = [
      { id: 1, name: "Acme Trding" },
      { id: 2, name: "Acme Trading Sdn Bhd" },
    ];

    const result = resolveVendorByName("Acme Trading", vendors);

    expect(result).toEqual({
      matched: false,
      error: 'Vendor name "Acme Trading" matches more than one existing vendor',
      code: "AMBIGUOUS_VENDOR_NAME",
    });
  });

  it("safely skips a vendor with a malformed (non-string) name instead of crashing", () => {
    const vendors = [
      { id: 1, name: null as any },
      { id: 2, name: "Acme Trading" },
    ];

    const result = resolveVendorByName("Acme Trading", vendors);

    expect(result).toEqual({ matched: true, vendorId: 2 });
  });
});