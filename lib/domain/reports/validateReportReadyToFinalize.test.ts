import { describe, it, expect } from "vitest";
import { validateReportReadyToFinalize} from "./validateReportReadyToFinalize";

const complete = {
    vendor_summary: "Summary text",
    delivery_performance: "Delivery text",
    pricing_analysis: "Pricing text",
    order_accuracy: "Accuracy text",
};

describe("validateReportReadyToFinalize", () => {
    it("accepts four non-empty sections", () => {
      expect(validateReportReadyToFinalize(complete)).toEqual({ valid: true });
    });
    it("rejects a null vendor_summary", () => {
      expect(
        validateReportReadyToFinalize({ ...complete, vendor_summary: null })
      ).toEqual({
        valid: false,
        error: "Vendor summary cannot be empty",
        code: "VALIDATION_FAILED",
        field: "vendor_summary",
      });
    });
    it("rejects a whitespace-only pricing_analysis", () => {
      expect(
        validateReportReadyToFinalize({ ...complete, pricing_analysis: "   " })
      ).toEqual({
        valid: false,
        error: "Pricing analysis cannot be empty",
        code: "VALIDATION_FAILED",
        field: "pricing_analysis",
      });
    });
  });