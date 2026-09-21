import { it, describe, expect } from "vitest";
import { validateNarrativeNumbers } from "./validateNarrativeNumbers";

describe("validateNarrativeNumbers", () => {
  const metrics = {
    onTimeDeliveryRate: 75,
    avgDelayDays: 1.33,
    overchargeRate: 33.33,
    avgOverchargePct: 15,
    transactionCount: 100,
  };

  it("accepts a narrative whose numbers all appear in the structured metric data", () => {
    const result = validateNarrativeNumbers(
      "On-time delivery was 75 with an average delay of 1.33 days.",
      metrics
    );
    expect(result).toEqual({ valid: true });
  });

  it("accepts RM-prefixed and comma-formatted amounts that match a stored value", () => {
    const result = validateNarrativeNumbers(
      "The agreed spend was RM 100 against a billed total of RM12,750.75.",
      { agreedSpend: 100, billedTotal: 12750.75 }
    );
    expect(result).toEqual({ valid: true });
  });

  it("treats 100 in the narrative as a match for a stored 100.00", () => {
    const result = validateNarrativeNumbers("The rate was RM 100.", {
      rate: 100.0,
    });
    expect(result).toEqual({ valid: true });
  });

  it("rejects a narrative that contains a number not present in the structured data", () => {
    const result = validateNarrativeNumbers(
      "On-time delivery was 75 and delay was 9 days.",
      metrics
    );
    expect(result).toEqual({
      valid: false,
      unmatchedValues: [9],
    });
  });

  it("collects every unmatched number rather than stopping at the first", () => {
    const result = validateNarrativeNumbers(
      "Rates of 12 and 99 were observed.",
      metrics
    );
    expect(result).toEqual({
      valid: false,
      unmatchedValues: [12, 99],
    });
  });

  it("ignores null metric fields when checking allowed numbers", () => {
    const result = validateNarrativeNumbers("The overcharge rate was 33.33.", {
      overchargeRate: 33.33,
      avgDelayDays: null,
    });
    expect(result).toEqual({ valid: true });
  });

  it("does not treat the parts of an ISO date as standalone numbers", () => {
    const result = validateNarrativeNumbers(
      "Results cover 2026-01-15 with an on-time rate of 75.",
      metrics
    );
    expect(result).toEqual({ valid: true });
  });

  it("accepts a narrative that contains no numbers at all", () => {
    const result = validateNarrativeNumbers(
      "Delivery performance is described in the section below.",
      metrics
    );
    expect(result).toEqual({ valid: true });
  });
});
