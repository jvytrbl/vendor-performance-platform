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
});
