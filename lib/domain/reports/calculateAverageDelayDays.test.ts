import { it, describe, expect } from "vitest";
import { calculateAverageDelayDays} from "./calculateAverageDelayDays";

describe("calculateAverageDelayDays", () => {
    it("averages delay days only among late deliveries, ignoring on-time and not-yet-delivered ones", () => {
        const result = calculateAverageDelayDays([
            { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-20" }, // 10 days late
            { agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-02-04" }, // 20 days late
            { agreed_delivery_date: "2026-02-01", actual_delivery_date: "2026-02-01" }, // on-time — excluded
            { agreed_delivery_date: "2026-02-10", actual_delivery_date: null },         // not yet delivered — excluded
          ]);
        
        //(10 + 20 ) / 2 Late Deliveries = 15, worked out by hand
        expect(result).toBe(15);
    });

    it("returns null when there are no transactions at all", () => {
        expect(calculateAverageDelayDays([])).toBeNull();
      });
      it("returns null when no transactions have been delivered yet", () => {
        const result = calculateAverageDelayDays([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: null },
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: undefined },
        ]);
        expect(result).toBeNull();
      });
      it("returns 0 when deliveries have been completed but none were late", () => {
        const result = calculateAverageDelayDays([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10" }, // on-time
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-01-14" }, // early
        ]);
        expect(result).toBe(0);
      });
      it("returns 0 when the only completed deliveries are on-time, even if others are still pending", () => {
        const result = calculateAverageDelayDays([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10" },
          { agreed_delivery_date: "2026-02-01", actual_delivery_date: null },
        ]);
        expect(result).toBe(0);
      });
      it("treats a delivery exactly on the agreed date as on-time, so it does not contribute to the average", () => {
        const result = calculateAverageDelayDays([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10" }, // on-time — excluded
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-01-16" }, // 1 day late
        ]);
        // only the 1-day-late delivery counts
        expect(result).toBe(1);
      });
      it("treats a delivery one day after the agreed date as 1 day of delay", () => {
        const result = calculateAverageDelayDays([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-11" },
        ]);
        expect(result).toBe(1);
      });
      it("rounds to two decimal places when the result doesn't divide evenly", () => {
        const result = calculateAverageDelayDays([
          { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-11" }, // 1 day late
          { agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-01-16" }, // 1 day late
          { agreed_delivery_date: "2026-01-20", actual_delivery_date: "2026-01-22" }, // 2 days late
        ]);
        // (1 + 1 + 2) / 3 = 1.333...%, must round to exactly 1.33
        expect(result).toBe(1.33);
      });
})