import { it, describe, expect } from "vitest";
import { calculateOverdeliveryRate } from "./calculateOverdeliveryRate";

describe("calculateOverdeliveryRate", () => {
  it("computes the percentage of recorded-quantity transactions that received more than ordered, ignoring unreceived ones", () => {
    const result = calculateOverdeliveryRate([
      { quantity_ordered: 10, quantity_received: 8 },  // short — not over
      { quantity_ordered: 10, quantity_received: 6 },  // short — not over
      { quantity_ordered: 10, quantity_received: 12 }, // over
      { quantity_ordered: 10, quantity_received: 10 }, // exact — not over
      { quantity_ordered: 10, quantity_received: null }, // not received — excluded
    ]);
    // 1 of 4 recorded transactions was an over-delivery = 25, worked out by hand
    expect(result).toBe(25);
  });

  it("returns null when there are no transactions at all", () => {
    expect(calculateOverdeliveryRate([])).toBeNull();
  });

  it("returns null when no transactions have a received quantity yet", () => {
    const result = calculateOverdeliveryRate([
      { quantity_ordered: 10, quantity_received: null },
      { quantity_ordered: 8, quantity_received: undefined },
    ]);
    expect(result).toBeNull();
  });

  it("returns 0 when quantities are recorded but none were over-delivered", () => {
    const result = calculateOverdeliveryRate([
      { quantity_ordered: 10, quantity_received: 10 }, // exact
      { quantity_ordered: 10, quantity_received: 8 },  // short
    ]);
    expect(result).toBe(0);
  });

  it("returns 0 when the only recorded quantities match or are short, even if others are still unreceived", () => {
    const result = calculateOverdeliveryRate([
      { quantity_ordered: 10, quantity_received: 10 },
      { quantity_ordered: 8, quantity_received: null },
    ]);
    expect(result).toBe(0);
  });

  it("treats received equal to ordered as not an over-delivery", () => {
    const result = calculateOverdeliveryRate([
      { quantity_ordered: 10, quantity_received: 10 },
    ]);
    expect(result).toBe(0);
  });

  it("treats one unit over ordered as an over-delivery", () => {
    const result = calculateOverdeliveryRate([
      { quantity_ordered: 10, quantity_received: 11 },
    ]);
    expect(result).toBe(100);
  });

  it("rounds to two decimal places when the result doesn't divide evenly", () => {
    const result = calculateOverdeliveryRate([
      { quantity_ordered: 10, quantity_received: 12 }, // over
      { quantity_ordered: 10, quantity_received: 10 }, // exact
      { quantity_ordered: 10, quantity_received: 8 },  // short
    ]);
    // 1 of 3 = 33.333...%, must round to exactly 33.33
    expect(result).toBe(33.33);
  });
});
