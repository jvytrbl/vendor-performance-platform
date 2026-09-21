import { it, describe, expect } from "vitest";
import { calculatePeerAverage } from "./calculatePeerAverage";

describe("calculatePeerAverage", () => {
  it("averages the metric across other vendors in the report, excluding the vendor being measured", () => {
    const result = calculatePeerAverage(1, [
      { vendorId: 1, value: 90 },
      { vendorId: 2, value: 40 },
      { vendorId: 3, value: 50 },
    ]);
    // (40 + 50) / 2 = 45; vendor 1's 90 must not be included
    expect(result).toBe(45);
  });

  it("returns null when the report contains only the vendor being measured", () => {
    const result = calculatePeerAverage(1, [{ vendorId: 1, value: 80 }]);
    expect(result).toBeNull();
  });

  it("returns null when there are no vendor metrics at all", () => {
    expect(calculatePeerAverage(1, [])).toBeNull();
  });

  it("returns null when every other vendor's value is null", () => {
    const result = calculatePeerAverage(1, [
      { vendorId: 1, value: 80 },
      { vendorId: 2, value: null },
      { vendorId: 3, value: null },
    ]);
    expect(result).toBeNull();
  });

  it("ignores null peer values and averages only the numeric ones", () => {
    const result = calculatePeerAverage(1, [
      { vendorId: 1, value: 10 },
      { vendorId: 2, value: 20 },
      { vendorId: 3, value: null },
      { vendorId: 4, value: 40 },
    ]);
    // (20 + 40) / 2 = 30
    expect(result).toBe(30);
  });

  it("rounds to two decimal places when the peer average doesn't divide evenly", () => {
    const result = calculatePeerAverage(1, [
      { vendorId: 1, value: 99 },
      { vendorId: 2, value: 10 },
      { vendorId: 3, value: 10 },
      { vendorId: 4, value: 20 },
    ]);
    // (10 + 10 + 20) / 3 = 13.333..., must round to exactly 13.33
    expect(result).toBe(13.33);
  });
});
