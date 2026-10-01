import { describe, it, expect } from "vitest";
import {
  validateReportReadyToFinalize,
  isLegacyComparisonDraft,
} from "./validateReportReadyToFinalize";

const complete = {
  vendor_summary: "Summary text",
  delivery_performance: "Delivery text",
  pricing_analysis: "Pricing text",
  order_accuracy: "Accuracy text",
  ai_overall_comparison: null,
  ai_delivery_comparison: null,
  ai_pricing_comparison: null,
  ai_order_accuracy_comparison: null,
};

const completeWithComparison = {
  ...complete,
  ai_overall_comparison: "Overall comparison text",
  ai_delivery_comparison: "Delivery comparison text",
  ai_pricing_comparison: "Pricing comparison text",
  ai_order_accuracy_comparison: "Order accuracy comparison text",
};

describe("validateReportReadyToFinalize", () => {
  describe("original four sections (vendor count < 2, legacy draft)", () => {
    it("accepts four non-empty sections", () => {
      expect(validateReportReadyToFinalize(complete, 1)).toEqual({ valid: true });
    });
    it("rejects a null vendor_summary", () => {
      expect(
        validateReportReadyToFinalize({ ...complete, vendor_summary: null }, 1)
      ).toEqual({
        valid: false,
        error: "Vendor summary cannot be empty",
        code: "VALIDATION_FAILED",
        field: "vendor_summary",
      });
    });
    it("rejects a whitespace-only pricing_analysis", () => {
      expect(
        validateReportReadyToFinalize({ ...complete, pricing_analysis: "   " }, 1)
      ).toEqual({
        valid: false,
        error: "Pricing analysis cannot be empty",
        code: "VALIDATION_FAILED",
        field: "pricing_analysis",
      });
    });
  });

  describe("isLegacyComparisonDraft", () => {
    it("is true when all four comparison columns are null", () => {
      expect(isLegacyComparisonDraft(complete)).toBe(true);
    });
    it("is false when any comparison column is non-null", () => {
      expect(
        isLegacyComparisonDraft({ ...complete, ai_overall_comparison: "text" })
      ).toBe(false);
    });
  });

  describe("AI Comparative Analysis requirement", () => {
    it("is not required when vendor count is 1, even with comparison columns null", () => {
      expect(validateReportReadyToFinalize(complete, 1)).toEqual({ valid: true });
    });
    it("is not required for a legacy draft (all comparison columns null) even with >= 2 vendors", () => {
      expect(validateReportReadyToFinalize(complete, 2)).toEqual({ valid: true });
    });
    it("is required when vendor count >= 2 and the report is not a legacy draft", () => {
      expect(
        validateReportReadyToFinalize(
          { ...complete, ai_overall_comparison: "Overall comparison text" },
          2
        )
      ).toEqual({
        valid: false,
        error: "Delivery comparison cannot be empty",
        code: "VALIDATION_FAILED",
        field: "ai_delivery_comparison",
      });
    });
    it("rejects an empty overall comparison when required", () => {
      expect(
        validateReportReadyToFinalize(
          { ...completeWithComparison, ai_overall_comparison: "   " },
          2
        )
      ).toEqual({
        valid: false,
        error: "Overall comparison cannot be empty",
        code: "VALIDATION_FAILED",
        field: "ai_overall_comparison",
      });
    });
    it("rejects an empty pricing comparison when required", () => {
      expect(
        validateReportReadyToFinalize(
          { ...completeWithComparison, ai_pricing_comparison: null },
          2
        )
      ).toEqual({
        valid: false,
        error: "Pricing comparison cannot be empty",
        code: "VALIDATION_FAILED",
        field: "ai_pricing_comparison",
      });
    });
    it("rejects an empty order accuracy comparison when required", () => {
      expect(
        validateReportReadyToFinalize(
          { ...completeWithComparison, ai_order_accuracy_comparison: "" },
          2
        )
      ).toEqual({
        valid: false,
        error: "Order accuracy comparison cannot be empty",
        code: "VALIDATION_FAILED",
        field: "ai_order_accuracy_comparison",
      });
    });
    it("accepts all eight sections filled in for a >= 2 vendor, non-legacy report", () => {
      expect(validateReportReadyToFinalize(completeWithComparison, 2)).toEqual({
        valid: true,
      });
    });
    it("accepts all eight sections filled in for a many-vendor report", () => {
      expect(validateReportReadyToFinalize(completeWithComparison, 5)).toEqual({
        valid: true,
      });
    });
  });
});
