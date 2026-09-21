import { it, describe, expect } from "vitest";
import { calculateAverageOverdeliveryUnits } from "./calculateAverageOverdeliveryUnits";

describe("calculateAverageOverdeliveryUnits", () => {
  it("averages extra units only among over-delivered transactions, ignoring short, exact, and unreceived ones", () => {
    const result = calculateAverageOverdeliveryUnits([
      { quantity_ordered: 10, quantity_received: 12 }, // 2 units over
      { quantity_ordered: 10, quantity_received: 15 }, // 5 units over
      { quantity_ordered: 10, quantity_received: 8 },  // short — excluded
      { quantity_ordered: 10, quantity_received: 10 }, // exact — excluded
      { quantity_ordered: 10, quantity_received: null }, // unreceived — excluded
    ]);
    // (2 + 5) / 2 over-deliveries = 3.5, worked out by hand
    expect(result).toBe(3.5);
  });

  it("returns null when there are no transactions at all", () => {
    expect(calculateAverageOverdeliveryUnits([])).toBeNull();
  });

  it("returns null when no transactions have a received quantity yet", () => {
    const result = calculateAverageOverdeliveryUnits([
      { quantity_ordered: 10, quantity_received: null },
      { quantity_ordered: 8, quantity_received: undefined },
    ]);
    expect(result).toBeNull();
  });

  it("returns 0 when quantities are recorded but none were over-delivered", () => {
    const result = calculateAverageOverdeliveryUnits([
      { quantity_ordered: 10, quantity_received: 10 },
      { quantity_ordered: 10, quantity_received: 8 },
    ]);
    expect(result).toBe(0);
  });

  it("returns 0 when the only recorded quantities match or are short, even if others are still unreceived", () => {
    const result = calculateAverageOverdeliveryUnits([
      { quantity_ordered: 10, quantity_received: 10 },
      { quantity_ordered: 8, quantity_received: null },
    ]);
    expect(result).toBe(0);
  });

  it("treats received equal to ordered as not contributing to the average", () => {
    const result = calculateAverageOverdeliveryUnits([
      { quantity_ordered: 10, quantity_received: 10 }, // exact — excluded
      { quantity_ordered: 10, quantity_received: 11 }, // 1 unit over
    ]);
    expect(result).toBe(1);
  });

  it("treats one unit over ordered as 1 unit of over-delivery", () => {
    const result = calculateAverageOverdeliveryUnits([
      { quantity_ordered: 10, quantity_received: 11 },
    ]);
    expect(result).toBe(1);
  });

  it("rounds to two decimal places when the result doesn't divide evenly", () => {
    const result = calculateAverageOverdeliveryUnits([
      { quantity_ordered: 10, quantity_received: 11 }, // 1
      { quantity_ordered: 10, quantity_received: 11 }, // 1
      { quantity_ordered: 10, quantity_received: 12 }, // 2
    ]);
    // (1 + 1 + 2) / 3 = 1.333..., must round to exactly 1.33
    expect(result).toBe(1.33);
  });
});
