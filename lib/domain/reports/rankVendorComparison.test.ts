import { describe, it, expect } from "vitest";
import { rankVendorComparison, type VendorMetricsInput } from "./rankVendorComparison";
import type { VendorPeriodMetrics } from "./buildMetricPromptData";

function metrics(overrides: Partial<VendorPeriodMetrics> = {}): VendorPeriodMetrics {
  return {
    onTimeDeliveryRate: 90,
    avgDelayDays: 1,
    overchargeRate: 5,
    avgOverchargePct: 2,
    underchargeRate: 0,
    shortfallRate: 2,
    avgShortfallUnits: 1,
    overdeliveryRate: 2,
    avgOverdeliveryUnits: 1,
    ...overrides,
  };
}

function vendor(id: number, overrides: Partial<VendorPeriodMetrics> = {}): VendorMetricsInput {
  return { vendorId: id, metrics: metrics(overrides) };
}

function result(vendors: VendorMetricsInput[]) {
  return rankVendorComparison(vendors);
}

describe("rankVendorComparison", () => {
  // 1. Two vendors.
  it("ranks two vendors where one clearly leads on every metric", () => {
    const a = vendor(1, {
      onTimeDeliveryRate: 98,
      avgDelayDays: 0,
      overchargeRate: 1,
      avgOverchargePct: 0,
      shortfallRate: 0,
      avgShortfallUnits: 0,
      overdeliveryRate: 0,
      avgOverdeliveryUnits: 0,
    });
    const b = vendor(2, {
      onTimeDeliveryRate: 70,
      avgDelayDays: 5,
      overchargeRate: 20,
      avgOverchargePct: 15,
      shortfallRate: 10,
      avgShortfallUnits: 5,
      overdeliveryRate: 10,
      avgOverdeliveryUnits: 5,
    });

    const r = result([a, b]);
    const vA = r.vendors.find((v) => v.vendorId === 1)!;
    const vB = r.vendors.find((v) => v.vendorId === 2)!;

    expect(vA.categories.delivery).toEqual({ status: "ranked", rank: 1, tied: false });
    expect(vA.categories.pricing).toEqual({ status: "ranked", rank: 1, tied: false });
    expect(vA.categories.orderAccuracy).toEqual({ status: "ranked", rank: 1, tied: false });
    expect(vA.overall).toEqual({ status: "ranked", rank: 1, tied: false });
    expect(vB.overall).toEqual({ status: "ranked", rank: 2, tied: false });
    expect(r.overallLeaders).toEqual([1]);
    expect(r.categoryLeaders.delivery).toEqual([1]);
  });

  // 2. Many vendors, clear ordering.
  it("ranks five vendors in a clear, uniform order across every metric", () => {
    const vendors = [1, 2, 3, 4, 5].map((id) =>
      vendor(id, {
        onTimeDeliveryRate: 100 - id * 5,
        avgDelayDays: id,
        overchargeRate: id * 2,
        avgOverchargePct: id,
        shortfallRate: id,
        avgShortfallUnits: id * 0.5,
        overdeliveryRate: id,
        avgOverdeliveryUnits: id * 0.5,
      })
    );

    const r = result(vendors);

    for (const id of [1, 2, 3, 4, 5]) {
      const v = r.vendors.find((entry) => entry.vendorId === id)!;
      expect(v.overall).toEqual({ status: "ranked", rank: id, tied: false });
    }
    expect(r.overallLeaders).toEqual([1]);
  });

  // 3. All values equal — full tie everywhere.
  it("ties every vendor at rank 1 in every category and overall when all values are equal", () => {
    const vendors = [1, 2, 3].map((id) => vendor(id));

    const r = result(vendors);

    for (const v of r.vendors) {
      expect(v.categories.delivery).toEqual({ status: "ranked", rank: 1, tied: true });
      expect(v.categories.pricing).toEqual({ status: "ranked", rank: 1, tied: true });
      expect(v.categories.orderAccuracy).toEqual({ status: "ranked", rank: 1, tied: true });
      expect(v.overall).toEqual({ status: "ranked", rank: 1, tied: true });
    }
    expect(r.overallLeaders.sort()).toEqual([1, 2, 3]);
  });

  // 4. Ties at the top only.
  it("shares rank 1 between two tied leaders and skips to rank 3 for the remaining vendor (1,1,3)", () => {
    const a = vendor(1, { onTimeDeliveryRate: 95, avgDelayDays: 0 });
    const b = vendor(2, { onTimeDeliveryRate: 95, avgDelayDays: 0 });
    const c = vendor(3, { onTimeDeliveryRate: 60, avgDelayDays: 10 });

    const r = result([a, b, c]);

    expect(r.vendors.find((v) => v.vendorId === 1)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 1,
      tied: true,
    });
    expect(r.vendors.find((v) => v.vendorId === 2)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 1,
      tied: true,
    });
    expect(r.vendors.find((v) => v.vendorId === 3)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 3,
      tied: false,
    });
    expect(r.categoryLeaders.delivery.sort()).toEqual([1, 2]);
  });

  // 5. Ties in the middle only.
  it("shares rank 2 between two tied middle vendors while the leader stays rank 1", () => {
    const a = vendor(1, { onTimeDeliveryRate: 99, avgDelayDays: 0 });
    const b = vendor(2, { onTimeDeliveryRate: 80, avgDelayDays: 2 });
    const c = vendor(3, { onTimeDeliveryRate: 80, avgDelayDays: 2 });

    const r = result([a, b, c]);

    expect(r.vendors.find((v) => v.vendorId === 1)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 1,
      tied: false,
    });
    expect(r.vendors.find((v) => v.vendorId === 2)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 2,
      tied: true,
    });
    expect(r.vendors.find((v) => v.vendorId === 3)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 2,
      tied: true,
    });
  });

  // 6. Null in one metric for one vendor (same category still ranks it).
  it("ranks a vendor in a category using only its non-null metrics when one metric is null", () => {
    const a = vendor(1, { onTimeDeliveryRate: null, avgDelayDays: 1 });
    const b = vendor(2, { onTimeDeliveryRate: 90, avgDelayDays: 2 });
    const c = vendor(3, { onTimeDeliveryRate: 80, avgDelayDays: 3 });

    const r = result([a, b, c]);

    // vendor 1: only avgDelayDays ranks (rank 1 of 3) -> category score 1 -> best
    // vendor 2: onTime rank 1, avgDelay rank 2 -> score 1.5
    // vendor 3: onTime rank 2, avgDelay rank 3 -> score 2.5
    expect(r.vendors.find((v) => v.vendorId === 1)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 1,
      tied: false,
    });
    expect(r.vendors.find((v) => v.vendorId === 2)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 2,
      tied: false,
    });
    expect(r.vendors.find((v) => v.vendorId === 3)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 3,
      tied: false,
    });
  });

  // 7. Null in a whole category for one vendor.
  it("gives 'not-enough-data' for a vendor whose whole category is null, and 'not-enough-data' overall since it lacks one category", () => {
    const a = vendor(1, { onTimeDeliveryRate: null, avgDelayDays: null });
    const b = vendor(2);

    const r = result([a, b]);

    expect(r.vendors.find((v) => v.vendorId === 1)!.categories.delivery).toEqual({
      status: "not-enough-data",
    });
    expect(r.vendors.find((v) => v.vendorId === 1)!.overall).toEqual({ status: "not-enough-data" });
    expect(r.vendors.find((v) => v.vendorId === 2)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 1,
      tied: false,
    });
    expect(r.vendors.find((v) => v.vendorId === 2)!.overall).toEqual({
      status: "ranked",
      rank: 1,
      tied: false,
    });
    expect(r.categoryLeaders.delivery).toEqual([2]);
    expect(r.overallLeaders).toEqual([2]);
  });

  // 8. All vendors null in a category.
  it("gives every vendor 'not-enough-data' in a category (and overall) when nobody has data for it", () => {
    const a = vendor(1, { onTimeDeliveryRate: null, avgDelayDays: null });
    const b = vendor(2, { onTimeDeliveryRate: null, avgDelayDays: null });

    const r = result([a, b]);

    for (const v of r.vendors) {
      expect(v.categories.delivery).toEqual({ status: "not-enough-data" });
      expect(v.overall).toEqual({ status: "not-enough-data" });
    }
    expect(r.categoryLeaders.delivery).toEqual([]);
    expect(r.overallLeaders).toEqual([]);
  });

  // 9. One vendor null in a category while others have data — confirms the
  // excluded vendor doesn't skew the other vendors' relative ranks.
  it("ranks the remaining vendors normally against each other when one vendor is excluded from a category", () => {
    const a = vendor(1, { onTimeDeliveryRate: null, avgDelayDays: null });
    const b = vendor(2, { onTimeDeliveryRate: 95, avgDelayDays: 0 });
    const c = vendor(3, { onTimeDeliveryRate: 60, avgDelayDays: 5 });

    const r = result([a, b, c]);

    expect(r.vendors.find((v) => v.vendorId === 1)!.categories.delivery).toEqual({
      status: "not-enough-data",
    });
    expect(r.vendors.find((v) => v.vendorId === 2)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 1,
      tied: false,
    });
    expect(r.vendors.find((v) => v.vendorId === 3)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 2,
      tied: false,
    });
  });

  // 10. Boundary values — exactly equal floats tie, not a false ordering.
  it("treats exactly-equal decimal values as a genuine tie, not floating-point noise", () => {
    const a = vendor(1, { overchargeRate: 33.33, avgOverchargePct: 10.1 });
    const b = vendor(2, { overchargeRate: 33.33, avgOverchargePct: 10.1 });

    const r = result([a, b]);

    expect(r.vendors.find((v) => v.vendorId === 1)!.categories.pricing).toEqual({
      status: "ranked",
      rank: 1,
      tied: true,
    });
    expect(r.vendors.find((v) => v.vendorId === 2)!.categories.pricing).toEqual({
      status: "ranked",
      rank: 1,
      tied: true,
    });
  });

  // 11. undercharge_rate is excluded from ranking even when present and wildly different.
  it("never lets undercharge_rate affect the pricing ranking, no matter how different it is between vendors", () => {
    const a = vendor(1, { underchargeRate: 0 });
    const b = vendor(2, { underchargeRate: 75 });

    const r = result([a, b]);

    expect(r.vendors.find((v) => v.vendorId === 1)!.categories.pricing).toEqual({
      status: "ranked",
      rank: 1,
      tied: true,
    });
    expect(r.vendors.find((v) => v.vendorId === 2)!.categories.pricing).toEqual({
      status: "ranked",
      rank: 1,
      tied: true,
    });
  });

  // 12. Direction handling — lower-better (pricing), isolated from delivery's mixed directions.
  it("ranks a cheaper vendor first for lower-better pricing metrics", () => {
    const cheap = vendor(1, { overchargeRate: 2, avgOverchargePct: 1 });
    const expensive = vendor(2, { overchargeRate: 25, avgOverchargePct: 20 });

    const r = result([cheap, expensive]);

    expect(r.vendors.find((v) => v.vendorId === 1)!.categories.pricing).toEqual({
      status: "ranked",
      rank: 1,
      tied: false,
    });
    expect(r.vendors.find((v) => v.vendorId === 2)!.categories.pricing).toEqual({
      status: "ranked",
      rank: 2,
      tied: false,
    });
  });

  // 13. Direction handling — higher-better (on_time_delivery_rate) produces the inverse ordering of a lower-better metric.
  it("ranks a vendor with a higher on-time rate first, confirming higher-better isn't accidentally inverted", () => {
    const reliable = vendor(1, { onTimeDeliveryRate: 99, avgDelayDays: 0 });
    const unreliable = vendor(2, { onTimeDeliveryRate: 40, avgDelayDays: 0 });

    const r = result([reliable, unreliable]);

    expect(r.vendors.find((v) => v.vendorId === 1)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 1,
      tied: false,
    });
    expect(r.vendors.find((v) => v.vendorId === 2)!.categories.delivery).toEqual({
      status: "ranked",
      rank: 2,
      tied: false,
    });
  });
});
