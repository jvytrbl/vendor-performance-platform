import { describe, expect, it } from "vitest";
import { formatVendorRankText } from "./formatVendorRankText";

describe("formatVendorRankText", () => {
  it("formats an untied rank as a plain ordinal", () => {
    expect(formatVendorRankText({ status: "ranked", rank: 1, tied: false })).toBe("1st");
    expect(formatVendorRankText({ status: "ranked", rank: 2, tied: false })).toBe("2nd");
    expect(formatVendorRankText({ status: "ranked", rank: 3, tied: false })).toBe("3rd");
    expect(formatVendorRankText({ status: "ranked", rank: 11, tied: false })).toBe("11th");
  });

  it("prefixes a tied rank with 'Tied'", () => {
    expect(formatVendorRankText({ status: "ranked", rank: 2, tied: true })).toBe("Tied 2nd");
  });

  it("formats not-enough-data as text, not a blank or a zero", () => {
    expect(formatVendorRankText({ status: "not-enough-data" })).toBe("Not enough data");
  });
});
