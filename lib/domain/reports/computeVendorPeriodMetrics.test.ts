import { it, describe, expect } from "vitest";
import type { TransactionRecord } from "../../repositories/transactions";
import { computeVendorPeriodMetrics } from "./computeVendorPeriodMetrics";

// Only id and vendor_id are required on TransactionRecord; every other field is
// optional, so a row can be built with just the fields a test cares about.
function tx(id: number, fields: Partial<TransactionRecord> = {}): TransactionRecord {
  return { id, vendor_id: 1, ...fields };
}

// What every metric returns when no row is eligible for it (never 0 — see the
// README: NULL means "no data", 0 means a measured zero).
const ALL_NULL = {
  onTimeDeliveryRate: null,
  avgDelayDays: null,
  overchargeRate: null,
  avgOverchargePct: null,
  underchargeRate: null,
  shortfallRate: null,
  avgShortfallUnits: null,
  overdeliveryRate: null,
  avgOverdeliveryUnits: null,
};

describe("computeVendorPeriodMetrics", () => {
  describe("happy path", () => {
    it("assembles all nine metrics and the transaction count from a realistic set of transactions", () => {
      const result = computeVendorPeriodMetrics([
        tx(1, { // on time, exact price, exact quantity
          agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10",
          agreed_price: 100, actual_price: 100,
          quantity_ordered: 10, quantity_received: 10,
        }),
        tx(2, { // 3 days late, overcharged 10%, short by 2
          agreed_delivery_date: "2026-01-15", actual_delivery_date: "2026-01-18",
          agreed_price: 100, actual_price: 110,
          quantity_ordered: 10, quantity_received: 8,
        }),
        tx(3, { // early, undercharged, over-delivered by 5
          agreed_delivery_date: "2026-01-20", actual_delivery_date: "2026-01-19",
          agreed_price: 200, actual_price: 180,
          quantity_ordered: 20, quantity_received: 25,
        }),
        tx(4, { // 4 days late, overcharged 20%, exact quantity
          agreed_delivery_date: "2026-02-01", actual_delivery_date: "2026-02-05",
          agreed_price: 50, actual_price: 60,
          quantity_ordered: 5, quantity_received: 5,
        }),
        tx(5, { // nothing delivered or invoiced yet — excluded from every rate
          agreed_delivery_date: "2026-02-10",
          agreed_price: 80,
          quantity_ordered: 4,
        }),
      ]);

      // Delivery (rows 1-4 completed): on time = rows 1 and 3 = 2 of 4 = 50.
      //   late delays = 3 and 4 days -> average (3 + 4) / 2 = 3.5
      // Pricing (rows 1-4 invoiced): overcharged = rows 2 and 4 = 2 of 4 = 50.
      //   overcharge % = 10 and 20 -> average 15. Undercharged = row 3 = 1 of 4 = 25.
      // Quantity (rows 1-4 received): short = row 2 = 1 of 4 = 25, by 2 units -> 2.
      //   over = row 3 = 1 of 4 = 25, by 5 units -> 5.
      // Count: all 5 rows, including the pending one.
      expect(result).toEqual({
        onTimeDeliveryRate: 50,
        avgDelayDays: 3.5,
        overchargeRate: 50,
        avgOverchargePct: 15,
        underchargeRate: 25,
        shortfallRate: 25,
        avgShortfallUnits: 2,
        overdeliveryRate: 25,
        avgOverdeliveryUnits: 5,
        transactionCount: 5,
      });
    });
  });

  describe("the three eligibility filters", () => {
    // Each test pairs a row that is eligible for everything with a second row
    // missing exactly one agreed value. The first row's result in the filtered
    // dimension is deliberately NOT zero, so if the second row were wrongly
    // counted, its place in the denominator would change the rate.

    it("leaves a row without an agreed delivery date out of the delivery metrics only", () => {
      const result = computeVendorPeriodMetrics([
        tx(1, { // on time, exact price, exact quantity
          agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10",
          agreed_price: 100, actual_price: 100,
          quantity_ordered: 10, quantity_received: 10,
        }),
        tx(2, { // no agreed_delivery_date: its (very late) actual date must not count
          actual_delivery_date: "2026-03-01",
          agreed_price: 100, actual_price: 120,
          quantity_ordered: 10, quantity_received: 5,
        }),
      ]);

      // Delivery: only row 1 -> 1 of 1 on time = 100, no late rows -> 0 days.
      // Pricing: rows 1 and 2 -> overcharged 1 of 2 = 50; row 2 is 20% over -> 20.
      // Quantity: rows 1 and 2 -> short 1 of 2 = 50, by 5 units -> 5.
      expect(result).toEqual({
        onTimeDeliveryRate: 100,
        avgDelayDays: 0,
        overchargeRate: 50,
        avgOverchargePct: 20,
        underchargeRate: 0,
        shortfallRate: 50,
        avgShortfallUnits: 5,
        overdeliveryRate: 0,
        avgOverdeliveryUnits: 0,
        transactionCount: 2,
      });
    });

    it("leaves a row without an agreed price out of the pricing metrics only", () => {
      const result = computeVendorPeriodMetrics([
        tx(1, { // on time, overcharged 10%, exact quantity
          agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10",
          agreed_price: 100, actual_price: 110,
          quantity_ordered: 10, quantity_received: 10,
        }),
        tx(2, { // no agreed_price: it must not dilute the overcharge rate
          agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-15",
          actual_price: 500,
          quantity_ordered: 10, quantity_received: 15,
        }),
      ]);

      // Delivery: rows 1 and 2 -> on time 1 of 2 = 50; row 2 is 5 days late -> 5.
      // Pricing: only row 1 -> overcharged 1 of 1 = 100 at 10%; none undercharged.
      //   (if row 2 counted in the denominator the rate would be 50)
      // Quantity: rows 1 and 2 -> short 0; over 1 of 2 = 50, by 5 units -> 5.
      expect(result).toEqual({
        onTimeDeliveryRate: 50,
        avgDelayDays: 5,
        overchargeRate: 100,
        avgOverchargePct: 10,
        underchargeRate: 0,
        shortfallRate: 0,
        avgShortfallUnits: 0,
        overdeliveryRate: 50,
        avgOverdeliveryUnits: 5,
        transactionCount: 2,
      });
    });

    it("leaves a row without an ordered quantity out of the quantity metrics only", () => {
      const result = computeVendorPeriodMetrics([
        tx(1, { // on time, exact price, short by 2
          agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10",
          agreed_price: 100, actual_price: 100,
          quantity_ordered: 10, quantity_received: 8,
        }),
        tx(2, { // no quantity_ordered: it must not dilute the shortfall rate
          agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10",
          agreed_price: 100, actual_price: 90,
          quantity_received: 3,
        }),
      ]);

      // Delivery: rows 1 and 2 both exactly on time -> 100, 0 days late.
      // Pricing: rows 1 and 2 -> overcharged 0; undercharged 1 of 2 = 50.
      // Quantity: only row 1 -> short 1 of 1 = 100, by 2 units; no over-delivery.
      //   (if row 2 counted in the denominator the shortfall rate would be 50)
      expect(result).toEqual({
        onTimeDeliveryRate: 100,
        avgDelayDays: 0,
        overchargeRate: 0,
        avgOverchargePct: 0,
        underchargeRate: 50,
        shortfallRate: 100,
        avgShortfallUnits: 2,
        overdeliveryRate: 0,
        avgOverdeliveryUnits: 0,
        transactionCount: 2,
      });
    });
  });

  describe("transactionCount", () => {
    it("counts every row, including rows excluded from all three metric subsets", () => {
      const result = computeVendorPeriodMetrics([
        tx(1), // no agreed fields at all: excluded from every subset
        tx(2),
        tx(3, {
          agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10",
          agreed_price: 100, actual_price: 100,
          quantity_ordered: 10, quantity_received: 10,
        }),
      ]);

      expect(result.transactionCount).toBe(3);
      expect(result.onTimeDeliveryRate).toBe(100); // only row 3 contributes
    });

    it("counts rows that are eligible but not yet delivered, invoiced or received", () => {
      const result = computeVendorPeriodMetrics([
        tx(1, { agreed_delivery_date: "2026-01-10", agreed_price: 100, quantity_ordered: 10 }),
        tx(2, { agreed_delivery_date: "2026-01-12", agreed_price: 100, quantity_ordered: 10 }),
      ]);

      // Passes the filters, but the calculators find no completed rows -> null.
      expect(result).toEqual({ ...ALL_NULL, transactionCount: 2 });
    });
  });

  describe("edge cases", () => {
    // ---- 1. Boundary ----
    // The period start/end dates are not this function's concern: it never sees
    // the period. Inclusive/exclusive handling lives in getTransactionsForPeriod's
    // SQL (transaction_date >= @dateFrom AND <= @dateTo), so it is not tested here.
    describe("boundary values", () => {
      it("handles exactly one transaction that sits on every threshold", () => {
        const result = computeVendorPeriodMetrics([
          tx(1, {
            agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10", // exactly on the date
            agreed_price: 100, actual_price: 100, // exactly the agreed price
            quantity_ordered: 10, quantity_received: 10, // exactly the ordered quantity
          }),
        ]);

        // Exactly on the date counts as on time; equal price is neither over nor under;
        // equal quantity is neither short nor over. All rates are a measured 0 (or 100).
        expect(result).toEqual({
          onTimeDeliveryRate: 100,
          avgDelayDays: 0,
          overchargeRate: 0,
          avgOverchargePct: 0,
          underchargeRate: 0,
          shortfallRate: 0,
          avgShortfallUnits: 0,
          overdeliveryRate: 0,
          avgOverdeliveryUnits: 0,
          transactionCount: 1,
        });
      });

      it("treats one day late, one cent over, and one unit short as the smallest violations", () => {
        const result = computeVendorPeriodMetrics([
          tx(1, {
            agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-11", // 1 day late
            agreed_price: 100, actual_price: 100.01, // 0.01 over
            quantity_ordered: 10, quantity_received: 9, // 1 unit short
          }),
        ]);

        // On time: 0 of 1 = 0. Delay = 1 day.
        // Overcharge: 1 of 1 = 100; (100.01 - 100) / 100 * 100 = 0.01 (rounded to 2 dp).
        // Shortfall: 1 of 1 = 100, by 1 unit.
        expect(result.onTimeDeliveryRate).toBe(0);
        expect(result.avgDelayDays).toBe(1);
        expect(result.overchargeRate).toBe(100);
        expect(result.avgOverchargePct).toBe(0.01);
        expect(result.shortfallRate).toBe(100);
        expect(result.avgShortfallUnits).toBe(1);
      });
    });

    // ---- 2. Empty / null ----
    describe("empty and null input", () => {
      it("returns every metric as null (not 0) and a count of 0 for no transactions", () => {
        expect(computeVendorPeriodMetrics([])).toEqual({ ...ALL_NULL, transactionCount: 0 });
      });

      it("returns every metric as null when no row has any agreed value", () => {
        const result = computeVendorPeriodMetrics([tx(1), tx(2), tx(3)]);
        expect(result).toEqual({ ...ALL_NULL, transactionCount: 3 });
      });

      it("treats an actual value of null (what SQL NULL looks like) the same as undefined", () => {
        // The columns actual_delivery_date, actual_price and quantity_received are
        // nullable in the database, so mssql hands back null, not undefined.
        const result = computeVendorPeriodMetrics([
          {
            id: 1,
            vendor_id: 1,
            agreed_delivery_date: "2026-01-10",
            actual_delivery_date: null,
            agreed_price: 100,
            actual_price: null,
            quantity_ordered: 10,
            quantity_received: null,
          } as unknown as TransactionRecord,
        ]);
        expect(result).toEqual({ ...ALL_NULL, transactionCount: 1 });
      });

      // The repository returns result.recordset unmapped, so a SQL NULL arrives as
      // null. agreed_delivery_date, agreed_price and quantity_ordered are NOT NULL in
      // migration 001, so null cannot reach the filters from the database today.
      // The filters only exclude undefined, so if null ever did arrive it would NOT
      // be excluded. The three tests below show what that would produce.
      // documents current behaviour, see known limitation
      it("agreed_delivery_date of null is not excluded: it is read as 1970-01-01 and every delivery is 'late'", () => {
        const result = computeVendorPeriodMetrics([
          {
            id: 1,
            vendor_id: 1,
            agreed_delivery_date: null,
            actual_delivery_date: "2026-01-10",
          } as unknown as TransactionRecord,
        ]);

        // new Date(null) is the epoch, so the actual date is days after it.
        const daysSinceEpoch = Date.parse("2026-01-10") / 86_400_000;
        expect(result.onTimeDeliveryRate).toBe(0);
        expect(result.avgDelayDays).toBe(daysSinceEpoch);
      });

      // documents current behaviour, see known limitation
      it("agreed_price of null is not excluded: it is compared as 0, so any actual price is an overcharge of Infinity %", () => {
        const result = computeVendorPeriodMetrics([
          {
            id: 1,
            vendor_id: 1,
            agreed_price: null,
            actual_price: 100,
          } as unknown as TransactionRecord,
        ]);

        expect(result.overchargeRate).toBe(100);
        expect(result.avgOverchargePct).toBe(Infinity);
        expect(result.underchargeRate).toBe(0);
      });

      // documents current behaviour, see known limitation
      it("quantity_ordered of null is not excluded: it is compared as 0, so any received quantity is an over-delivery", () => {
        const result = computeVendorPeriodMetrics([
          {
            id: 1,
            vendor_id: 1,
            quantity_ordered: null,
            quantity_received: 5,
          } as unknown as TransactionRecord,
        ]);

        expect(result.shortfallRate).toBe(0);
        expect(result.overdeliveryRate).toBe(100);
        expect(result.avgOverdeliveryUnits).toBe(5);
      });
    });

    // ---- 3. Wrong type ----
    // The module does no validation: the database constraints (prices > 0,
    // quantities > 0, valid dates) and validateTransactionInput are what keep
    // these values out. Each test pins what the code does if they did get in.
    describe("wrong types and invalid numbers", () => {
      // documents current behaviour, see known limitation
      it("treats an unparseable date as 'late' for the rate but ignores it in the average delay", () => {
        const result = computeVendorPeriodMetrics([
          tx(1, { agreed_delivery_date: "2026-01-10", actual_delivery_date: "not-a-date" }),
        ]);

        // new Date("not-a-date") is NaN; NaN <= date is false, so it counts as not on time.
        // The delay is NaN, and NaN > 0 is false, so no late delay is recorded -> 0.
        // The two delivery metrics therefore disagree: 0% on time, yet 0 days late.
        expect(result.onTimeDeliveryRate).toBe(0);
        expect(result.avgDelayDays).toBe(0);
      });

      // documents current behaviour, see known limitation
      it("returns an overcharge of Infinity % when the agreed price is 0", () => {
        const result = computeVendorPeriodMetrics([
          tx(1, { agreed_price: 0, actual_price: 10 }),
        ]);

        // (10 - 0) / 0 * 100 = Infinity. The database blocks agreed_price <= 0.
        expect(result.overchargeRate).toBe(100);
        expect(result.avgOverchargePct).toBe(Infinity);
      });

      // documents current behaviour, see known limitation
      it("does not count a row as over- or undercharged when a price is NaN", () => {
        const result = computeVendorPeriodMetrics([
          tx(1, { agreed_price: NaN, actual_price: 100 }),
          tx(2, { agreed_price: 100, actual_price: NaN }),
        ]);

        // Every comparison with NaN is false: both rows are 'priced' but neither
        // over nor under, so the rates are 0 rather than null.
        expect(result.overchargeRate).toBe(0);
        expect(result.avgOverchargePct).toBe(0);
        expect(result.underchargeRate).toBe(0);
      });

      // documents current behaviour, see known limitation
      it("compares two numeric strings as text, so '9' counts as MORE than '100'", () => {
        const result = computeVendorPeriodMetrics([
          tx(1, {
            agreed_price: "100" as unknown as number,
            actual_price: "9" as unknown as number,
          }),
        ]);

        // "9" > "100" is true as text (compares "9" with "1"), although 9 < 100 as numbers.
        // The percentage uses subtraction, which converts to numbers: (9 - 100) / 100 * 100 = -91.
        expect(result.overchargeRate).toBe(100);
        expect(result.avgOverchargePct).toBe(-91);
        expect(result.underchargeRate).toBe(0);
      });

      // documents current behaviour, see known limitation
      it("accepts negative prices and quantities without complaint", () => {
        const result = computeVendorPeriodMetrics([
          tx(1, {
            agreed_price: -100, actual_price: -90,
            quantity_ordered: -10, quantity_received: -12,
          }),
        ]);

        // -90 > -100 is an 'overcharge'; (-90 - -100) / -100 * 100 = -10.
        // -12 < -10 is a 'shortfall' of -10 - -12 = 2 units.
        expect(result.overchargeRate).toBe(100);
        expect(result.avgOverchargePct).toBe(-10);
        expect(result.shortfallRate).toBe(100);
        expect(result.avgShortfallUnits).toBe(2);
      });

      // documents current behaviour, see known limitation
      it("passes an Infinity actual price straight through to the average", () => {
        const result = computeVendorPeriodMetrics([
          tx(1, { agreed_price: 100, actual_price: Infinity }),
        ]);

        expect(result.overchargeRate).toBe(100);
        expect(result.avgOverchargePct).toBe(Infinity);
      });
    });

    // ---- 4. Duplicate / conflict ----
    describe("duplicates", () => {
      // documents current behaviour, see known limitation
      it("counts a repeated row every time it appears (no de-duplication by id)", () => {
        const onTime = tx(1, { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-10" });
        const late = tx(2, { agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-12" });

        const result = computeVendorPeriodMetrics([onTime, late, late]);

        // 1 on-time of 3 completed = 33.33; the late row weighs twice. Ids are the
        // table's primary key, so the database cannot return duplicates.
        expect(result.onTimeDeliveryRate).toBe(33.33);
        expect(result.avgDelayDays).toBe(2);
        expect(result.transactionCount).toBe(3);
      });

      it("gives the same rates for two identical rows as for one", () => {
        const row = {
          agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-12",
          agreed_price: 100, actual_price: 110,
          quantity_ordered: 10, quantity_received: 8,
        };
        const one = computeVendorPeriodMetrics([tx(1, row)]);
        const two = computeVendorPeriodMetrics([tx(1, row), tx(2, row)]);

        // Averages and rates are ratios, so only the count differs.
        expect(two).toEqual({ ...one, transactionCount: 2 });
      });
    });

    // ---- 5. Permission ----
    // Not applicable: this is a pure function with no caller identity. Access
    // control is enforced by withAuth on the generate route that calls it.

    // ---- 6. Scale ----
    describe("scale", () => {
      it("computes 10,000 transactions quickly and correctly", () => {
        const rows: TransactionRecord[] = [];
        for (let i = 0; i < 10_000; i += 1) {
          rows.push(
            tx(i + 1, {
              agreed_delivery_date: "2026-01-10",
              actual_delivery_date: i % 4 === 0 ? "2026-01-10" : "2026-01-12", // 3 in 4 are 2 days late
              agreed_price: 100,
              actual_price: i % 5 === 0 ? 110 : i % 5 === 1 ? 90 : 100, // 1 in 5 over, 1 in 5 under
              quantity_ordered: 10,
              quantity_received: i % 10 === 0 ? 8 : i % 10 === 1 ? 13 : 10, // 1 in 10 short, 1 in 10 over
            })
          );
        }

        const started = performance.now();
        const result = computeVendorPeriodMetrics(rows);
        const elapsedMs = performance.now() - started;

        // On time 2,500 of 10,000 = 25; late rows are all 2 days -> 2.
        // Over 2,000 of 10,000 = 20 at 10%; under 2,000 = 20.
        // Short 1,000 = 10 by 2 units; over 1,000 = 10 by 3 units.
        expect(result).toEqual({
          onTimeDeliveryRate: 25,
          avgDelayDays: 2,
          overchargeRate: 20,
          avgOverchargePct: 10,
          underchargeRate: 20,
          shortfallRate: 10,
          avgShortfallUnits: 2,
          overdeliveryRate: 10,
          avgOverdeliveryUnits: 3,
          transactionCount: 10_000,
        });
        expect(elapsedMs).toBeLessThan(1000);
      });
    });

    // ---- 7. Concurrency ----
    // Not applicable: pure and synchronous, with no shared or module-level state.
    describe("input safety", () => {
      it("does not mutate the input array or its rows", () => {
        const rows = [
          tx(1, {
            agreed_delivery_date: "2026-01-10", actual_delivery_date: "2026-01-12",
            agreed_price: 100, actual_price: 110,
            quantity_ordered: 10, quantity_received: 8,
          }),
          tx(2),
        ];
        const before = structuredClone(rows);
        // Frozen objects throw on write in strict mode, so a hidden mutation would fail loudly.
        rows.forEach((row) => Object.freeze(row));
        Object.freeze(rows);

        expect(() => computeVendorPeriodMetrics(rows)).not.toThrow();
        expect(rows).toEqual(before);
      });
    });

    // ---- 8. Security-hostile input ----
    describe("hostile input", () => {
      it("ignores extra and prototype-style properties on rows and does not pollute Object.prototype", () => {
        // JSON.parse makes "__proto__" an ordinary own property rather than setting the prototype.
        const hostile = JSON.parse(
          `{"id": 1, "vendor_id": 1,
            "agreed_delivery_date": "2026-01-10", "actual_delivery_date": "2026-01-10",
            "__proto__": {"agreed_price": 1, "quantity_ordered": 1},
            "constructor": {"prototype": {"agreed_price": 1}},
            "isAdmin": true,
            "item_description": "'; DROP TABLE VENDOR_TRANSACTIONS; --"}`
        ) as TransactionRecord;

        const result = computeVendorPeriodMetrics([hostile]);

        // Only the delivery fields are real: the price and quantity subsets stay empty.
        expect(result).toEqual({ ...ALL_NULL, onTimeDeliveryRate: 100, avgDelayDays: 0, transactionCount: 1 });
        expect(({} as Record<string, unknown>).agreed_price).toBeUndefined();
        expect(({} as Record<string, unknown>).quantity_ordered).toBeUndefined();
      });
    });
  });
});
