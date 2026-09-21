import { it, describe, expect } from "vitest";
import { calculateUnderchargeRate } from "./calculateUnderChargeRate";

describe("calculateUnderchargeRate", () => {
  it("computes the percentage of priced transactions that charged less than agreed, ignoring unpriced ones", () => {
    const result = calculateUnderchargeRate([
      { agreed_price: 100, actual_price: 120 }, // over — not under
      { agreed_price: 100, actual_price: 80 },  // under
      { agreed_price: 100, actual_price: 100 }, // exact match — not under
      { agreed_price: 50, actual_price: 60 },   // over — not under
      { agreed_price: 100, actual_price: null }, // unpriced — excluded
    ]);
    // 1 of 4 priced transactions was an undercharge = 25, worked out by hand
    expect(result).toBe(25);
  });

  it("returns null when there are no transactions at all", () => {
    expect(calculateUnderchargeRate([])).toBeNull();
  });

  it("returns null when no transactions have an actual price yet", () => {
    const result = calculateUnderchargeRate([
      { agreed_price: 100, actual_price: null },
      { agreed_price: 80, actual_price: undefined },
    ]);
    expect(result).toBeNull();
  });

  it("returns 0 when transactions are priced but none were undercharged", () => {
    const result = calculateUnderchargeRate([
      { agreed_price: 100, actual_price: 100 }, // exact
      { agreed_price: 100, actual_price: 110 }, // over
    ]);
    expect(result).toBe(0);
  });

  it("returns 0 when the only priced transactions match or are over, even if others are still unpriced", () => {
    const result = calculateUnderchargeRate([
      { agreed_price: 100, actual_price: 100 },
      { agreed_price: 80, actual_price: null },
    ]);
    expect(result).toBe(0);
  });

  it("treats an actual price equal to the agreed price as not an undercharge", () => {
    const result = calculateUnderchargeRate([
      { agreed_price: 100, actual_price: 100 },
    ]);
    expect(result).toBe(0);
  });

  it("treats an actual price one unit below the agreed price as an undercharge", () => {
    const result = calculateUnderchargeRate([
      { agreed_price: 100, actual_price: 99 },
    ]);
    expect(result).toBe(100);
  });

  it("rounds to two decimal places when the result doesn't divide evenly", () => {
    const result = calculateUnderchargeRate([
      { agreed_price: 100, actual_price: 80 },  // under
      { agreed_price: 100, actual_price: 100 }, // exact
      { agreed_price: 100, actual_price: 120 }, // over
    ]);
    // 1 of 3 = 33.333...%, must round to exactly 33.33
    expect(result).toBe(33.33);
  });
});