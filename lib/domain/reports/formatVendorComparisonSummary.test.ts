import { describe, expect, it } from "vitest";
import { formatVendorComparisonSummaries } from "./formatVendorComparisonSummary";
import type { RankVendorComparisonResult } from "./rankVendorComparison";

const names = new Map([
  [1, "Acme"],
  [2, "Globex"],
  [3, "Initech"],
]);

function comparisonResult(overrides: Partial<RankVendorComparisonResult>): RankVendorComparisonResult {
  return {
    vendors: [],
    categoryLeaders: { delivery: [], pricing: [], orderAccuracy: [] },
    overallLeaders: [],
    ...overrides,
  };
}

describe("formatVendorComparisonSummaries", () => {
  it("names a single clear leader", () => {
    const comparison = comparisonResult({
      vendors: [
        {
          vendorId: 1,
          categories: {
            delivery: { status: "ranked", rank: 1, tied: false },
            pricing: { status: "ranked", rank: 1, tied: false },
            orderAccuracy: { status: "ranked", rank: 1, tied: false },
          },
          overall: { status: "ranked", rank: 1, tied: false },
        },
        {
          vendorId: 2,
          categories: {
            delivery: { status: "ranked", rank: 2, tied: false },
            pricing: { status: "ranked", rank: 2, tied: false },
            orderAccuracy: { status: "ranked", rank: 2, tied: false },
          },
          overall: { status: "ranked", rank: 2, tied: false },
        },
      ],
    });

    const result = formatVendorComparisonSummaries(comparison, names);

    expect(result.overall).toBe("Acme ranks 1st; Globex ranks 2nd.");
    expect(result.delivery).toBe("Acme ranks 1st; Globex ranks 2nd.");
  });

  it("describes a tied leader using 'are tied for'", () => {
    const comparison = comparisonResult({
      vendors: [
        {
          vendorId: 1,
          categories: {
            delivery: { status: "ranked", rank: 1, tied: true },
            pricing: { status: "not-enough-data" },
            orderAccuracy: { status: "not-enough-data" },
          },
          overall: { status: "not-enough-data" },
        },
        {
          vendorId: 2,
          categories: {
            delivery: { status: "ranked", rank: 1, tied: true },
            pricing: { status: "not-enough-data" },
            orderAccuracy: { status: "not-enough-data" },
          },
          overall: { status: "not-enough-data" },
        },
      ],
    });

    const result = formatVendorComparisonSummaries(comparison, names);

    expect(result.delivery).toBe("Acme and Globex are tied for 1st.");
  });

  it("names three-or-more tied vendors with an Oxford-comma list", () => {
    const comparison = comparisonResult({
      vendors: [1, 2, 3].map((vendorId) => ({
        vendorId,
        categories: {
          delivery: { status: "ranked" as const, rank: 1, tied: true },
          pricing: { status: "not-enough-data" as const },
          orderAccuracy: { status: "not-enough-data" as const },
        },
        overall: { status: "not-enough-data" as const },
      })),
    });

    const result = formatVendorComparisonSummaries(comparison, names);

    expect(result.delivery).toBe("Acme, Globex, and Initech are tied for 1st.");
  });

  it("appends a not-enough-data clause for vendors excluded from the category", () => {
    const comparison = comparisonResult({
      vendors: [
        {
          vendorId: 1,
          categories: {
            delivery: { status: "ranked", rank: 1, tied: false },
            pricing: { status: "not-enough-data" },
            orderAccuracy: { status: "not-enough-data" },
          },
          overall: { status: "not-enough-data" },
        },
        {
          vendorId: 2,
          categories: {
            delivery: { status: "not-enough-data" },
            pricing: { status: "not-enough-data" },
            orderAccuracy: { status: "not-enough-data" },
          },
          overall: { status: "not-enough-data" },
        },
      ],
    });

    const result = formatVendorComparisonSummaries(comparison, names);

    expect(result.delivery).toBe("Acme ranks 1st; Globex does not have enough data for this.");
  });

  it("falls back to a plain message when there are no vendor entries at all", () => {
    const comparison = comparisonResult({ vendors: [] });

    const result = formatVendorComparisonSummaries(comparison, names);

    expect(result.delivery).toBe("There is not enough data to compare vendors here.");
    expect(result.overall).toBe("There is not enough data to compare vendors here.");
  });

  it("names every vendor with the not-enough-data clause when all are excluded", () => {
    const comparison = comparisonResult({
      vendors: [1, 2].map((vendorId) => ({
        vendorId,
        categories: {
          delivery: { status: "not-enough-data" as const },
          pricing: { status: "not-enough-data" as const },
          orderAccuracy: { status: "not-enough-data" as const },
        },
        overall: { status: "not-enough-data" as const },
      })),
    });

    const result = formatVendorComparisonSummaries(comparison, names);

    expect(result.delivery).toBe("Acme and Globex do not have enough data for this.");
  });

  // PINNED WORDING — do not change this test's expected strings casually.
  // The read-only report view (ReportEditor.tsx) rebuilds a vendor
  // comparison table at view time and only trusts it when the first stored
  // paragraph matches formatVendorComparisonSummaries' CURRENT output
  // byte-for-byte (see buildVendorComparisonView.ts). If you change this
  // function's wording, every already-generated report's stored lead
  // sentence stops matching what gets recomputed from it, and those reports
  // silently fall back to today's plain-text rendering (no table) — not a
  // crash, but a visible regression for every existing report. If you need
  // to change the wording, update this test deliberately and know that
  // existing stored reports will lose their tables until regenerated.
  it("pins the exact lead-sentence wording the read-only table rebuild depends on", () => {
    const comparison = comparisonResult({
      vendors: [
        {
          vendorId: 1,
          categories: {
            delivery: { status: "ranked", rank: 1, tied: false },
            pricing: { status: "ranked", rank: 2, tied: true },
            orderAccuracy: { status: "not-enough-data" },
          },
          overall: { status: "ranked", rank: 1, tied: false },
        },
        {
          vendorId: 2,
          categories: {
            delivery: { status: "ranked", rank: 2, tied: false },
            pricing: { status: "ranked", rank: 2, tied: true },
            orderAccuracy: { status: "not-enough-data" },
          },
          overall: { status: "ranked", rank: 2, tied: false },
        },
      ],
    });

    const result = formatVendorComparisonSummaries(comparison, names);

    expect(result.overall).toBe("Acme ranks 1st; Globex ranks 2nd.");
    expect(result.delivery).toBe("Acme ranks 1st; Globex ranks 2nd.");
    expect(result.pricing).toBe("Acme and Globex are tied for 2nd.");
    expect(result.orderAccuracy).toBe("Acme and Globex do not have enough data for this.");
  });

  it("falls back to 'Vendor {id}' when a name isn't in the map", () => {
    const comparison = comparisonResult({
      vendors: [
        {
          vendorId: 99,
          categories: {
            delivery: { status: "ranked", rank: 1, tied: false },
            pricing: { status: "not-enough-data" },
            orderAccuracy: { status: "not-enough-data" },
          },
          overall: { status: "not-enough-data" },
        },
      ],
    });

    const result = formatVendorComparisonSummaries(comparison, names);

    expect(result.delivery).toBe("Vendor 99 ranks 1st.");
  });
});
