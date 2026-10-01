import { describe, expect, it } from "vitest";
import {
  buildCategoryComparisonView,
  buildOverallComparisonView,
  buildVendorRanking,
  CATEGORY_METRIC_COLUMNS,
  type VendorMetricsRow,
} from "./buildVendorComparisonView";

const names = new Map([
  [1, "Acme"],
  [2, "Globex"],
]);

function metricsRow(overrides: Partial<VendorMetricsRow> & { vendor_id: number }): VendorMetricsRow {
  return {
    on_time_delivery_rate: null,
    avg_delay_days: null,
    overcharge_rate: null,
    avg_overcharge_pct: null,
    undercharge_rate: null,
    shortfall_rate: null,
    avg_shortfall_units: null,
    overdelivery_rate: null,
    avg_overdelivery_units: null,
    ...overrides,
  };
}

// Acme beats Globex on every ranked metric except order accuracy, where
// they're tied — gives one subsection each of: plain leader, and a tie.
const acme = metricsRow({
  vendor_id: 1,
  on_time_delivery_rate: 90,
  avg_delay_days: 1,
  overcharge_rate: 0,
  avg_overcharge_pct: 0,
  undercharge_rate: 20,
  shortfall_rate: 0,
  avg_shortfall_units: 1,
  overdelivery_rate: 0,
  avg_overdelivery_units: 20,
});
const globex = metricsRow({
  vendor_id: 2,
  on_time_delivery_rate: 80,
  avg_delay_days: 5,
  overcharge_rate: 10,
  avg_overcharge_pct: 5,
  undercharge_rate: 5,
  shortfall_rate: 0,
  avg_shortfall_units: 1,
  overdelivery_rate: 0,
  avg_overdelivery_units: 20,
});

const LEAD = {
  overall: "Acme ranks 1st; Globex ranks 2nd.",
  delivery: "Acme ranks 1st; Globex ranks 2nd.",
  pricing: "Acme ranks 1st; Globex ranks 2nd.",
  orderAccuracy: "Acme and Globex are tied for 1st.",
};

describe("buildVendorRanking (join rule)", () => {
  it("defaults a vendor missing from metricsRows to all-null metrics, never throwing", () => {
    expect(() => buildVendorRanking([1, 2, 3], [acme, globex])).not.toThrow();
    const result = buildVendorRanking([1, 2, 3], [acme, globex]);
    const vendor3 = result.vendors.find((v) => v.vendorId === 3)!;
    expect(vendor3.overall).toEqual({ status: "not-enough-data" });
    expect(vendor3.categories.delivery).toEqual({ status: "not-enough-data" });
    expect(vendor3.categories.pricing).toEqual({ status: "not-enough-data" });
    expect(vendor3.categories.orderAccuracy).toEqual({ status: "not-enough-data" });
  });
});

describe("CATEGORY_METRIC_COLUMNS", () => {
  it("flags undercharge_rate as unranked in the pricing columns, and only there", () => {
    const underchargeColumn = CATEGORY_METRIC_COLUMNS.pricing.find(
      (c) => c.key === "undercharge_rate"
    );
    expect(underchargeColumn?.unranked).toBe(true);
    for (const category of ["delivery", "orderAccuracy"] as const) {
      expect(CATEGORY_METRIC_COLUMNS[category].some((c) => c.key === "undercharge_rate")).toBe(
        false
      );
    }
  });
});

describe("buildOverallComparisonView", () => {
  it("returns 'empty' when storedText is null", () => {
    const view = buildOverallComparisonView({
      vendorIds: [1, 2],
      vendorNames: names,
      metricsRows: [acme, globex],
      storedText: null,
    });
    expect(view).toEqual({ mode: "empty" });
  });

  it("builds a table when the stored lead sentence matches the recomputed ranking", () => {
    const view = buildOverallComparisonView({
      vendorIds: [1, 2],
      vendorNames: names,
      metricsRows: [acme, globex],
      storedText: `${LEAD.overall}\n\nAcme is cheaper but Globex ships sooner.`,
    });
    expect(view.mode).toBe("table");
    if (view.mode !== "table") throw new Error("expected table mode");
    expect(view.leadLine).toBe(LEAD.overall);
    expect(view.commentaryParagraphs).toEqual(["Acme is cheaper but Globex ships sooner."]);
    expect(view.rows).toEqual([
      {
        vendorId: 1,
        vendorName: "Acme",
        overall: { status: "ranked", rank: 1, tied: false },
        categoryRanks: {
          delivery: { status: "ranked", rank: 1, tied: false },
          pricing: { status: "ranked", rank: 1, tied: false },
          orderAccuracy: { status: "ranked", rank: 1, tied: true },
        },
      },
      {
        vendorId: 2,
        vendorName: "Globex",
        overall: { status: "ranked", rank: 2, tied: false },
        categoryRanks: {
          delivery: { status: "ranked", rank: 2, tied: false },
          pricing: { status: "ranked", rank: 2, tied: false },
          orderAccuracy: { status: "ranked", rank: 1, tied: true },
        },
      },
    ]);
  });

  it("falls back to text-only when the stored first paragraph was edited away from the computed lead sentence", () => {
    const view = buildOverallComparisonView({
      vendorIds: [1, 2],
      vendorNames: names,
      metricsRows: [acme, globex],
      storedText: "Acme is clearly the better vendor overall.\n\nMore detail here.",
    });
    expect(view).toEqual({
      mode: "text-only",
      paragraphs: ["Acme is clearly the better vendor overall.", "More detail here."],
    });
  });

  it("a vendor missing from metricsRows shows 'Not enough data' in the rebuilt table, not a crash", () => {
    const threeNames = new Map([...names, [3, "Initech"]]);
    const leadWithThird =
      "Acme ranks 1st; Globex ranks 2nd; Initech does not have enough data for this.";
    const view = buildOverallComparisonView({
      vendorIds: [1, 2, 3],
      vendorNames: threeNames,
      metricsRows: [acme, globex],
      storedText: `${leadWithThird}\n\nCommentary.`,
    });
    expect(view.mode).toBe("table");
    if (view.mode !== "table") throw new Error("expected table mode");
    const initechRow = view.rows.find((row) => row.vendorId === 3)!;
    expect(initechRow.overall).toEqual({ status: "not-enough-data" });
  });
});

describe("buildCategoryComparisonView", () => {
  it("returns 'empty' when storedText is null", () => {
    const view = buildCategoryComparisonView("delivery", {
      vendorIds: [1, 2],
      vendorNames: names,
      metricsRows: [acme, globex],
      storedText: null,
    });
    expect(view).toEqual({ mode: "empty" });
  });

  it("builds a table with rank + unit-bearing metric values for a category", () => {
    const view = buildCategoryComparisonView("delivery", {
      vendorIds: [1, 2],
      vendorNames: names,
      metricsRows: [acme, globex],
      storedText: `${LEAD.delivery}\n\nAcme is more punctual.`,
    });
    expect(view.mode).toBe("table");
    if (view.mode !== "table") throw new Error("expected table mode");
    expect(view.rows).toEqual([
      {
        vendorId: 1,
        vendorName: "Acme",
        rank: { status: "ranked", rank: 1, tied: false },
        metrics: { on_time_delivery_rate: 90, avg_delay_days: 1 },
      },
      {
        vendorId: 2,
        vendorName: "Globex",
        rank: { status: "ranked", rank: 2, tied: false },
        metrics: { on_time_delivery_rate: 80, avg_delay_days: 5 },
      },
    ]);
  });

  it("includes undercharge_rate as an unranked column in the pricing table", () => {
    const view = buildCategoryComparisonView("pricing", {
      vendorIds: [1, 2],
      vendorNames: names,
      metricsRows: [acme, globex],
      storedText: `${LEAD.pricing}\n\nAcme overcharges less.`,
    });
    expect(view.mode).toBe("table");
    if (view.mode !== "table") throw new Error("expected table mode");
    expect(view.rows[0].metrics.undercharge_rate).toBe(20);
    expect(view.rows[1].metrics.undercharge_rate).toBe(5);
  });

  it("describes a tie correctly in the rebuilt table (order accuracy)", () => {
    const view = buildCategoryComparisonView("orderAccuracy", {
      vendorIds: [1, 2],
      vendorNames: names,
      metricsRows: [acme, globex],
      storedText: `${LEAD.orderAccuracy}\n\nBoth vendors perform identically here.`,
    });
    expect(view.mode).toBe("table");
    if (view.mode !== "table") throw new Error("expected table mode");
    expect(view.rows[0].rank).toEqual({ status: "ranked", rank: 1, tied: true });
    expect(view.rows[1].rank).toEqual({ status: "ranked", rank: 1, tied: true });
  });

  it("falls back to text-only when the stored lead sentence was edited", () => {
    const view = buildCategoryComparisonView("delivery", {
      vendorIds: [1, 2],
      vendorNames: names,
      metricsRows: [acme, globex],
      storedText: "Acme wins on delivery, hands down.",
    });
    expect(view).toEqual({
      mode: "text-only",
      paragraphs: ["Acme wins on delivery, hands down."],
    });
  });
});
