import { describe, expect, it } from "vitest";
import { parseNarrativeSections } from "./parseNarrativeSections";

const distinct = [
  "Vendor Summary:",
  "One vendor is in this period.",
  "",
  "Delivery Performance:",
  "On-time delivery was 100.",
  "",
  "Pricing Analysis:",
  "Agreed and actual prices match.",
  "",
  "Order Accuracy:",
  "Ordered and received quantities match.",
].join("\n");

describe("parseNarrativeSections", () => {
  it("splits four distinct sections", () => {
    expect(parseNarrativeSections(distinct)).toEqual({
      vendor_summary: "One vendor is in this period.",
      delivery_performance: "On-time delivery was 100.",
      pricing_analysis: "Agreed and actual prices match.",
      order_accuracy: "Ordered and received quantities match.",
    });
  });

  it("returns null when a heading is missing", () => {
    expect(parseNarrativeSections("On-time delivery was 100.")).toBeNull();
  });

  it("returns null when every section repeats the same paragraph", () => {
    const repeated = [
      "Vendor Summary:",
      "On-time delivery was 100.",
      "Delivery Performance:",
      "On-time delivery was 100.",
      "Pricing Analysis:",
      "On-time delivery was 100.",
      "Order Accuracy:",
      "On-time delivery was 100.",
    ].join("\n");
    expect(parseNarrativeSections(repeated)).toBeNull();
  });

  it("does not look for the comparison headings when includeComparison is omitted", () => {
    // The 8-heading text still parses fine for the base 4, with everything
    // after "Order Accuracy:" swallowed into that section's content, since
    // no comparison headings are being searched for.
    const withComparisonHeadings = [
      distinct,
      "Overall Comparison:",
      "Acme leads overall.",
    ].join("\n");
    const result = parseNarrativeSections(withComparisonHeadings);
    expect(result).not.toBeNull();
    expect(result!.order_accuracy).toContain("Overall Comparison:");
  });

  describe("includeComparison: true", () => {
    const withComparison = [
      distinct,
      "Overall Comparison:",
      "Overall trade-off commentary.",
      "",
      "Delivery Comparison:",
      "Delivery trade-off commentary.",
      "",
      "Pricing Comparison:",
      "Pricing trade-off commentary.",
      "",
      "Order Accuracy Comparison:",
      "Order accuracy trade-off commentary.",
    ].join("\n");

    it("parses all eight sections", () => {
      expect(parseNarrativeSections(withComparison, { includeComparison: true })).toEqual({
        vendor_summary: "One vendor is in this period.",
        delivery_performance: "On-time delivery was 100.",
        pricing_analysis: "Agreed and actual prices match.",
        order_accuracy: "Ordered and received quantities match.",
        ai_overall_comparison: "Overall trade-off commentary.",
        ai_delivery_comparison: "Delivery trade-off commentary.",
        ai_pricing_comparison: "Pricing trade-off commentary.",
        ai_order_accuracy_comparison: "Order accuracy trade-off commentary.",
      });
    });

    it("returns null when a comparison heading is missing", () => {
      expect(parseNarrativeSections(distinct, { includeComparison: true })).toBeNull();
    });

    it("returns null when a comparison section is empty", () => {
      const missingContent = [
        distinct,
        "Overall Comparison:",
        "",
        "Delivery Comparison:",
        "Delivery trade-off commentary.",
        "",
        "Pricing Comparison:",
        "Pricing trade-off commentary.",
        "",
        "Order Accuracy Comparison:",
        "Order accuracy trade-off commentary.",
      ].join("\n");
      expect(parseNarrativeSections(missingContent, { includeComparison: true })).toBeNull();
    });
  });
});
