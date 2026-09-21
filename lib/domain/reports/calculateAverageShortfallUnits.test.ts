import { it, describe, expect } from "vitest";
import { calculateAverageShortfallUnits } from "./calculateAverageShortfallUnits";

describe("calculateAverageShortfallUnits", () => {
  it("averages missing units only among shortfall transactions, ignoring over, exact, and unreceived ones", () => {
    const result = calculateAverageShortfallUnits([
      { quantity_ordered: 10, quantity_received: 8 },  // 2 units short
      { quantity_ordered: 10, quantity_received: 6 },  // 4 units short
      { quantity_ordered: 10, quantity_received: 12 }, // over — excluded
      { quantity_ordered: 10, quantity_received: 10 }, // exact — excluded
      { quantity_ordered: 10, quantity_received: null }, // unreceived — excluded
    ]);
    // (2 + 4) / 2 shortfalls = 3, worked out by hand
    expect(result).toBe(3);
  });

  it("returns null when there are no transactions at all", () => {
    expect(calculateAverageShortfallUnits([])).toBeNull();
  });

  it("returns null when no transactions have a received quantity yet", () => {
    const result = calculateAverageShortfallUnits([
      { quantity_ordered: 10, quantity_received: null },
      { quantity_ordered: 8, quantity_received: undefined },
    ]);
    expect(result).toBeNull();
  });

  it("returns 0 when quantities are recorded but none fell short", () => {
    const result = calculateAverageShortfallUnits([
      { quantity_ordered: 10, quantity_received: 10 },
      { quantity_ordered: 10, quantity_received: 12 },
    ]);
    expect(result).toBe(0);
  });

  it("returns 0 when the only recorded quantities match or are over, even if others are still unreceived", () => {
    const result = calculateAverageShortfallUnits([
      { quantity_ordered: 10, quantity_received: 10 },
      { quantity_ordered: 8, quantity_received: null },
    ]);
    expect(result).toBe(0);
  });

  it("treats received equal to ordered as not contributing to the average", () => {
    const result = calculateAverageShortfallUnits([
      { quantity_ordered: 10, quantity_received: 10 }, // exact — excluded
      { quantity_ordered: 10, quantity_received: 9 },  // 1 unit short
    ]);
    expect(result).toBe(1);
  });

  it("treats one unit under ordered as 1 unit of shortfall", () => {
    const result = calculateAverageShortfallUnits([
      { quantity_ordered: 10, quantity_received: 9 },
    ]);
    expect(result).toBe(1);
  });

  it("rounds to two decimal places when the result doesn't divide evenly", () => {
    const result = calculateAverageShortfallUnits([
      { quantity_ordered: 10, quantity_received: 9 }, // 1
      { quantity_ordered: 10, quantity_received: 9 }, // 1
      { quantity_ordered: 10, quantity_received: 8 }, // 2
    ]);
    // (1 + 1 + 2) / 3 = 1.333..., must round to exactly 1.33
    expect(result).toBe(1.33);
  });
});
