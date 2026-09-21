import { it, describe, expect } from "vitest";
import { validateNarrativeComparisons } from "./validateNarrativeComparisons";

describe("validateNarrativeComparisons", () => {
  it("accepts a narrative with no performance characterization", () => {
    const result = validateNarrativeComparisons(
      "On-time delivery was 75 percent for the selected period."
    );
    expect(result).toEqual({ valid: true });
  });

  it("accepts a characterization that compares against both the prior period and the peer average", () => {
    const result = validateNarrativeComparisons(
      "Delivery is improving versus the prior period and the peer average."
    );
    expect(result).toEqual({ valid: true });
  });

  it("accepts previous-period and other-vendors wording as the two required comparisons", () => {
    const result = validateNarrativeComparisons(
      "Pricing is declining against the previous period and other vendors."
    );
    expect(result).toEqual({ valid: true });
  });

  it("rejects a characterization that has no comparison at all", () => {
    const result = validateNarrativeComparisons("The vendor is improving.");
    expect(result).toEqual({
      valid: false,
      error:
        "Characterization must compare against both the prior period and the peer average",
    });
  });

  it("rejects a characterization that mentions only the prior period", () => {
    const result = validateNarrativeComparisons(
      "Performance is declining versus the prior period."
    );
    expect(result).toEqual({
      valid: false,
      error:
        "Characterization must compare against both the prior period and the peer average",
    });
  });

  it("rejects a characterization that mentions only the peer average", () => {
    const result = validateNarrativeComparisons(
      "Results are stable against the peer average."
    );
    expect(result).toEqual({
      valid: false,
      error:
        "Characterization must compare against both the prior period and the peer average",
    });
  });

  it("treats declined as a characterization that still needs both comparisons", () => {
    const result = validateNarrativeComparisons(
      "Order accuracy declined this quarter."
    );
    expect(result).toEqual({
      valid: false,
      error:
        "Characterization must compare against both the prior period and the peer average",
    });
  });
});
