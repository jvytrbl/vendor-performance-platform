import { it, describe, expect } from "vitest";
import {calculateOnTimeDeliveryRate } from "./calculateOnTimeDeliveryRate";

describe("calculateOnTimeDeliveryRate", () => {
    it("computes the percentage of completed deliveries that arrived on or before the agreed date", () => {
        const result = calculateOnTimeDeliveryRate([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10" }, // on-time (exactly on date)
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-01-14" }, // on-time (early)
          { agreed_delivery_date: "2026-01-20", actual_delivery_date: "2026-01-25" }, // late
          { agreed_delivery_date: "2026-02-01", actual_delivery_date: "2026-02-01" }, // on-time (exactly on date)
        ]);
        // 3 of 4 completed deliveries were on-time = 75%, worked out by hand, not by running the code
        expect(result).toBe(75);
      });

      it("returns null when there are no transactions at all", () => {
        const result = calculateOnTimeDeliveryRate([]);
        expect(result).toBeNull();
      });
      it("returns null when no transactions have been delivered yet", () => {
        const result = calculateOnTimeDeliveryRate([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: null },
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: undefined },
        ]);
        expect(result).toBeNull();
      });
      it("excludes not-yet-delivered transactions from the calculation entirely", () => {
        const result = calculateOnTimeDeliveryRate([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10" }, // on-time
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-01-14" }, // on-time
          { agreed_delivery_date: "2026-02-01", actual_delivery_date: null }, // not yet delivered — excluded
        ]);
        // both completed deliveries were on-time = 100%; the pending one must not count as late
        expect(result).toBe(100);
      });
      it("returns 100 when every completed delivery was on-time", () => {
        const result = calculateOnTimeDeliveryRate([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-09" },
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-01-15" },
        ]);
        expect(result).toBe(100);
      });
      it("returns 0 when every completed delivery was late", () => {
        const result = calculateOnTimeDeliveryRate([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-11" },
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-01-20" },
        ]);
        expect(result).toBe(0);
      });
      it("rounds to two decimal places when the result doesn't divide evenly", () => {
        const result = calculateOnTimeDeliveryRate([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10" }, // on-time
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-01-20" }, // late
          { agreed_delivery_date: "2026-01-20", actual_delivery_date: "2026-01-25" }, // late
        ]);
        // 1 of 3 = 33.333...%, must round to exactly 33.33
        expect(result).toBe(33.33);
      });
      it("treats a delivery exactly on the agreed date as on-time, not late", () => {
        const result = calculateOnTimeDeliveryRate([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10" },
        ]);
        expect(result).toBe(100);
      });
      it("treats a delivery one day after the agreed date as late, not on-time", () => {
        const result = calculateOnTimeDeliveryRate([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-11" },
        ]);
        expect(result).toBe(0);
      });
})