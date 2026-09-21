import { it, describe, expect } from "vitest";
import { calculateOverchargeRate } from "./calculateOverchargeRate";

describe("calculateOverchargeRate", () => {
  it("computes the percentage of priced transactions that charged more than agreed, ignoring unpriced ones", () => {
    const result = calculateOverchargeRate([
      { agreed_price: 100, actual_price: 120 }, // over
      { agreed_price: 100, actual_price: 80 },  // under — not over
      { agreed_price: 100, actual_price: 100 }, // exact match — not over
      { agreed_price: 50, actual_price: 60 },   // over
      { agreed_price: 100, actual_price: null }, // unpriced — excluded
    ]);
    // 2 of 4 priced transactions were overcharges = 50, worked out by hand
    expect(result).toBe(50);
  });

  it("returns null when there are no transactions at all", () => {
    expect(calculateOverchargeRate([])).toBeNull();
  });

  it("returns null when no transactions have an actual price yet", () => {
    const result = calculateOverchargeRate([
      { agreed_price: 100, actual_price: null },
      { agreed_price: 80, actual_price: undefined },
    ]);
    expect(result).toBeNull();
  });

  it("returns 0 when transactions are priced but none were overcharged", () => {
    const result = calculateOverchargeRate([
      { agreed_price: 100, actual_price: 100 }, // exact
      { agreed_price: 100, actual_price: 90 },  // under
    ]);
    expect(result).toBe(0);
  });

  it("returns 0 when the only priced transactions match or are under, even if others are still unpriced", () => {
    const result = calculateOverchargeRate([
      { agreed_price: 100, actual_price: 100 },
      { agreed_price: 80, actual_price: null },
    ]);
    expect(result).toBe(0);
  });

  it("treats an actual price equal to the agreed price as not an overcharge", () => {
    const result = calculateOverchargeRate([
      { agreed_price: 100, actual_price: 100 },
    ]);
    expect(result).toBe(0);
  });

  it("treats an actual price one unit above the agreed price as an overcharge", () => {
    const result = calculateOverchargeRate([
      { agreed_price: 100, actual_price: 101 },
    ]);
    expect(result).toBe(100);
  });

  it("rounds to two decimal places when the result doesn't divide evenly", () => {
    const result = calculateOverchargeRate([
      { agreed_price: 100, actual_price: 120 }, // over
      { agreed_price: 100, actual_price: 100 }, // exact
      { agreed_price: 100, actual_price: 80 },  // under
    ]);
    // 1 of 3 = 33.333...%, must round to exactly 33.33
    expect(result).toBe(33.33);
  });
});