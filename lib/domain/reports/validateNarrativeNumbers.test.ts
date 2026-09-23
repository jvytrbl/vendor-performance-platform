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

  it("accepts the nearest-whole-number rounding of a decimal source value", () => {
    const result = validateNarrativeNumbers(
      "On-time delivery was about 86% this period.",
      { onTimeDeliveryRate: 85.71 }
    );
    expect(result).toEqual({ valid: true });
  });

  it("still rejects a number that matches neither the exact value nor its nearest-whole-number rounding", () => {
    const result = validateNarrativeNumbers(
      "On-time delivery was about 90% this period.",
      { onTimeDeliveryRate: 85.71 }
    );
    expect(result).toEqual({ valid: false, unmatchedValues: [90] });
  });

  it("rounds .5 up when checking the nearest-whole-number allowance", () => {
    const result = validateNarrativeNumbers("The average delay was 2 days.", {
      avgDelayDays: 1.5,
    });
    expect(result).toEqual({ valid: true });
  });

  it("does not treat a vendor id in a 'Vendor N' reference as an invented number", () => {
    const result = validateNarrativeNumbers(
      "Performance metrics for Vendor 2 are entirely unavailable this period.",
      {}
    );
    expect(result).toEqual({ valid: true });
  });

  it("still flags a genuinely unmatched number that happens to follow the word 'Vendor' without being an id reference", () => {
    // Guardrail: confirms the "Vendor N" exclusion is narrow (only the id
    // immediately after "Vendor") and doesn't accidentally whitelist an
    // unrelated number elsewhere in the same sentence.
    const result = validateNarrativeNumbers(
      "Vendor 2 recorded a 42 percent overcharge rate.",
      {}
    );
    expect(result).toEqual({ valid: false, unmatchedValues: [42] });
  });
});
