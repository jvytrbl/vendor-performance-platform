import { describe, it, expect } from "vitest";
import { buildMetricPromptData } from "./buildMetricPromptData";
import { validateNarrativeNumbers } from "./validateNarrativeNumbers";

const zeros = {
  onTimeDeliveryRate: 0,
  avgDelayDays: 0,
  overchargeRate: 0,
  avgOverchargePct: 0,
  underchargeRate: 0,
  shortfallRate: 0,
  avgShortfallUnits: 0,
  overdeliveryRate: 0,
  avgOverdeliveryUnits: 0,
};

const vendor1Current = {
  ...zeros,
  onTimeDeliveryRate: 80,
  avgDelayDays: 1.5,
  overchargeRate: 10,
};

const vendor1Prior = {
  ...zeros,
  onTimeDeliveryRate: 70,
  avgDelayDays: 2,
  overchargeRate: 20,
};

const vendor2Current = {
  ...zeros,
  onTimeDeliveryRate: 40,
  avgDelayDays: 3,
  overchargeRate: 30,
};

const vendor3Current = {
  ...zeros,
  onTimeDeliveryRate: 60,
  avgDelayDays: 1,
  overchargeRate: 50,
};

describe("buildMetricPromptData", () => {
  it("emits flat Current, Prior, and PeerAverage fields for each metric", () => {
    const result = buildMetricPromptData({
      vendorId: 1,
      current: vendor1Current,
      prior: vendor1Prior,
      peers: [
        { vendorId: 1, metrics: vendor1Current },
        { vendorId: 2, metrics: vendor2Current },
        { vendorId: 3, metrics: vendor3Current },
      ],
    });

    // peer on-time: (40 + 60) / 2 = 50 — vendor 1's 80 must not be included
    expect(result.onTimeDeliveryRateCurrent).toBe(80);
    expect(result.onTimeDeliveryRatePrior).toBe(70);
    expect(result.onTimeDeliveryRatePeerAverage).toBe(50);
    expect(result.avgDelayDaysCurrent).toBe(1.5);
    expect(result.avgDelayDaysPrior).toBe(2);
    expect(result.avgDelayDaysPeerAverage).toBe(2);
    expect(result.overchargeRateCurrent).toBe(10);
    expect(result.overchargeRatePrior).toBe(20);
    expect(result.overchargeRatePeerAverage).toBe(40);
  });

  it("keeps null when a metric has no eligible transactions", () => {
    const result = buildMetricPromptData({
      vendorId: 1,
      current: { ...zeros, onTimeDeliveryRate: null },
      prior: { ...zeros, onTimeDeliveryRate: null },
      peers: [{ vendorId: 1, metrics: { ...zeros, onTimeDeliveryRate: null } }],
    });

    expect(result.onTimeDeliveryRateCurrent).toBeNull();
    expect(result.onTimeDeliveryRatePrior).toBeNull();
    expect(result.onTimeDeliveryRatePeerAverage).toBeNull();
  });

  it("returns a flat record that A9 can check against a narrative", () => {
    const data = buildMetricPromptData({
      vendorId: 1,
      current: vendor1Current,
      prior: vendor1Prior,
      peers: [
        { vendorId: 1, metrics: vendor1Current },
        { vendorId: 2, metrics: vendor2Current },
        { vendorId: 3, metrics: vendor3Current },
      ],
    });

    expect(
      validateNarrativeNumbers(
        "On-time delivery was 80 versus the prior period 70 and a peer average of 50.",
        data
      )
    ).toEqual({ valid: true });
  });
});