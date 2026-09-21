import { it, describe, expect } from "vitest";
import { calculateShortfallRate } from "./calculateShortfallRate";

describe("calculateShortfallRate", () => {
  it("computes the percentage of recorded-quantity transactions that received less than ordered, ignoring unreceived ones", () => {
    const result = calculateShortfallRate([
      { quantity_ordered: 10, quantity_received: 8 },  // shortfall
      { quantity_ordered: 10, quantity_received: 6 },  // shortfall
      { quantity_ordered: 10, quantity_received: 12 }, // over — not short
      { quantity_ordered: 10, quantity_received: 10 }, // exact — not short
      { quantity_ordered: 10, quantity_received: null }, // not received — excluded
    ]);
    // 2 of 4 recorded transactions were shortfalls = 50, worked out by hand
    expect(result).toBe(50);
  });

  it("returns null when there are no transactions at all", () => {
    expect(calculateShortfallRate([])).toBeNull();
  });

  it("returns null when no transactions have a received quantity yet", () => {
    const result = calculateShortfallRate([
      { quantity_ordered: 10, quantity_received: null },
      { quantity_ordered: 8, quantity_received: undefined },
    ]);
    expect(result).toBeNull();
  });

  it("returns 0 when quantities are recorded but none fell short", () => {
    const result = calculateShortfallRate([
      { quantity_ordered: 10, quantity_received: 10 }, // exact
      { quantity_ordered: 10, quantity_received: 12 }, // over
    ]);
    expect(result).toBe(0);
  });

  it("returns 0 when the only recorded quantities match or are over, even if others are still unreceived", () => {
    const result = calculateShortfallRate([
      { quantity_ordered: 10, quantity_received: 10 },
      { quantity_ordered: 8, quantity_received: null },
    ]);
    expect(result).toBe(0);
  });

  it("treats received equal to ordered as not a shortfall", () => {
    const result = calculateShortfallRate([
      { quantity_ordered: 10, quantity_received: 10 },
    ]);
    expect(result).toBe(0);
  });

  it("treats one unit under ordered as a shortfall", () => {
    const result = calculateShortfallRate([
      { quantity_ordered: 10, quantity_received: 9 },
    ]);
    expect(result).toBe(100);
  });

  it("rounds to two decimal places when the result doesn't divide evenly", () => {
    const result = calculateShortfallRate([
      { quantity_ordered: 10, quantity_received: 8 },  // short
      { quantity_ordered: 10, quantity_received: 10 }, // exact
      { quantity_ordered: 10, quantity_received: 12 }, // over
    ]);
    // 1 of 3 = 33.333...%, must round to exactly 33.33
    expect(result).toBe(33.33);
  });
});
