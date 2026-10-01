import { describe, expect, it } from "vitest";
import { validateVendorComparisonNarrative } from "./validateVendorComparisonNarrative";

const names = new Map([
  [1, "Acme"],
  [2, "Globex"],
]);

describe("validateVendorComparisonNarrative", () => {
  it("fails when the AI names a non-leader vendor as leading (hallucinated leader)", () => {
    const result = validateVendorComparisonNarrative("Globex leads this period.", [1], names);
    expect(result.valid).toBe(false);
  });

  it("passes when the AI correctly names the real leader", () => {
    const result = validateVendorComparisonNarrative("Acme leads this period.", [1], names);
    expect(result).toEqual({ valid: true });
  });

  it("passes when either tied leader is named with leadership language", () => {
    const resultA = validateVendorComparisonNarrative("Acme leads this period.", [1, 2], names);
    const resultB = validateVendorComparisonNarrative("Globex leads this period.", [1, 2], names);
    expect(resultA).toEqual({ valid: true });
    expect(resultB).toEqual({ valid: true });
  });

  it("fails when leadership language is applied to a vendor marked 'not enough data' (i.e. not in the leader set)", () => {
    // leaderVendorIds never includes a not-enough-data vendor — same check
    // as any other non-leader, no special case needed.
    const result = validateVendorComparisonNarrative("Globex is the clear leader.", [1], names);
    expect(result.valid).toBe(false);
  });

  it("passes a sentence naming both the leader and a non-leader, when only the leader carries leadership language", () => {
    const result = validateVendorComparisonNarrative("Acme leads while Globex trails.", [1], names);
    expect(result).toEqual({ valid: true });
  });

  it("passes legitimate single-metric trade-off language even for a non-leader vendor", () => {
    const result = validateVendorComparisonNarrative(
      "Globex was the cheapest option but the slowest to deliver.",
      [1],
      names
    );
    expect(result).toEqual({ valid: true });
  });

  it("passes empty text", () => {
    expect(validateVendorComparisonNarrative("", [1], names)).toEqual({ valid: true });
  });

  it("passes whitespace-only text", () => {
    expect(validateVendorComparisonNarrative("   \n\t  ", [1], names)).toEqual({ valid: true });
  });

  it("does not let a shorter vendor name match inside a longer one that's actually a different vendor", () => {
    const substringNames = new Map([
      [1, "Acme"],
      [2, "Acme Trading"],
    ]);
    // Acme Trading (vendor 2) is the leader; "Acme" alone (vendor 1) must
    // not be matched out of "Acme Trading leads" and treated as vendor 1.
    const result = validateVendorComparisonNarrative("Acme Trading leads this period.", [2], substringNames);
    expect(result).toEqual({ valid: true });
  });

  it("correctly flags the shorter name as a non-leader when it genuinely stands alone", () => {
    const substringNames = new Map([
      [1, "Acme"],
      [2, "Acme Trading"],
    ]);
    const result = validateVendorComparisonNarrative("Acme leads this period.", [2], substringNames);
    expect(result.valid).toBe(false);
  });

  it("handles vendor names containing regex special characters safely", () => {
    const specialNames = new Map([
      [1, "Acme & Co."],
      [2, "O'Brien (Pty) Ltd"],
    ]);
    const passing = validateVendorComparisonNarrative("Acme & Co. leads this period.", [1], specialNames);
    const failing = validateVendorComparisonNarrative("O'Brien (Pty) Ltd leads this period.", [1], specialNames);
    expect(passing).toEqual({ valid: true });
    expect(failing.valid).toBe(false);
  });

  it("is case-insensitive for both the vendor name and the leadership term", () => {
    const result = validateVendorComparisonNarrative("ACME LEADS this period.", [1], names);
    expect(result).toEqual({ valid: true });
  });
});
