import { describe, it, expect } from "vitest";
import { validateReportSections } from "./validateReportSections";

const validInput = {
  vendor_summary: "Summary text",
  delivery_performance: "Delivery text",
  pricing_analysis: "Pricing text",
  order_accuracy: "Accuracy text",
};

describe("validateReportSections", () => {
  it("accepts all four section strings", () => {
    expect(validateReportSections(validInput)).toEqual({
      valid: true,
      data: validInput,
    });
  });

  it("accepts empty strings because a Draft may still have unfilled sections", () => {
    const input = {
      vendor_summary: "",
      delivery_performance: "",
      pricing_analysis: "",
      order_accuracy: "",
    };
    expect(validateReportSections(input)).toEqual({ valid: true, data: input });
  });

  it("rejects a missing vendor_summary", () => {
    const { vendor_summary: _ignored, ...rest } = validInput;
    expect(validateReportSections(rest as any)).toEqual({
      valid: false,
      error: "Vendor summary is required",
      code: "VALIDATION_FAILED",
      field: "vendor_summary",
    });
  });

  it("rejects a non-string delivery_performance", () => {
    expect(
      validateReportSections({ ...validInput, delivery_performance: 12 } as any)
    ).toEqual({
      valid: false,
      error: "Delivery performance must be a string",
      code: "VALIDATION_FAILED",
      field: "delivery_performance",
    });
  });
});