import { it, describe, expect } from "vitest";
import { calculateAverageOverchargePct } from "./calculateAverageOverchargePct";

describe("calculateAverageOverchargePct", () => {
  it("averages overcharge percentage only among overcharged transactions, ignoring under, exact, and unpriced ones", () => {
    const result = calculateAverageOverchargePct([
      { agreed_price: 100, actual_price: 120 }, // 20% over
      { agreed_price: 50, actual_price: 55 },   // 10% over
      { agreed_price: 100, actual_price: 80 },  // under — excluded
      { agreed_price: 100, actual_price: 100 }, // exact — excluded
      { agreed_price: 100, actual_price: null }, // unpriced — excluded
    ]);
    // (20 + 10) / 2 overcharges = 15, worked out by hand
    expect(result).toBe(15);
  });

  it("returns null when there are no transactions at all", () => {
    expect(calculateAverageOverchargePct([])).toBeNull();
  });

  it("returns null when no transactions have an actual price yet", () => {
    const result = calculateAverageOverchargePct([
      { agreed_price: 100, actual_price: null },
      { agreed_price: 80, actual_price: undefined },
    ]);
    expect(result).toBeNull();
  });

  it("returns 0 when transactions are priced but none were overcharged", () => {
    const result = calculateAverageOverchargePct([
      { agreed_price: 100, actual_price: 100 }, // exact
      { agreed_price: 100, actual_price: 90 },  // under
    ]);
    expect(result).toBe(0);
  });

  it("returns 0 when the only priced transactions match or are under, even if others are still unpriced", () => {
    const result = calculateAverageOverchargePct([
      { agreed_price: 100, actual_price: 100 },
      { agreed_price: 80, actual_price: null },
    ]);
    expect(result).toBe(0);
  });

  it("treats an actual price equal to the agreed price as not contributing to the average", () => {
    const result = calculateAverageOverchargePct([
      { agreed_price: 100, actual_price: 100 }, // exact — excluded
      { agreed_price: 100, actual_price: 110 }, // 10% over
    ]);
    expect(result).toBe(10);
  });

  it("treats an actual price 1% above agreed as 1 percent overcharge", () => {
    const result = calculateAverageOverchargePct([
      { agreed_price: 100, actual_price: 101 },
    ]);
    expect(result).toBe(1);
  });

  it("rounds to two decimal places when the result doesn't divide evenly", () => {
    const result = calculateAverageOverchargePct([
      { agreed_price: 100, actual_price: 110 }, // 10%
      { agreed_price: 100, actual_price: 110 }, // 10%
      { agreed_price: 100, actual_price: 120 }, // 20%
    ]);
    // (10 + 10 + 20) / 3 = 13.333...%, must round to exactly 13.33
    expect(result).toBe(13.33);
  });
});