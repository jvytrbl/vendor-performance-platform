export interface ReportSectionInput {
    vendor_summary: string;
    delivery_performance:  string;
    pricing_analysis: string;
    order_accuracy: string;
    // Optional: this type is also the manual-edit input shape, which
    // doesn't know about these yet (Stage 3 extends validateReportSections()
    // itself for that path). Generation always supplies all four explicitly
    // (as text, or null for reports with fewer than 2 vendors) — see
    // runReportGeneration.ts and updateReportSections's conditional SET.
    ai_overall_comparison?: string | null;
    ai_delivery_comparison?: string | null;
    ai_pricing_comparison?: string | null;
    ai_order_accuracy_comparison?: string | null;
}

export type ReportSectionValidationResult =
    | { valid: true; data: ReportSectionInput}
    | { valid: false; error: string; code: string; field: string};

function requireString(
    value:  unknown,
    field: string,
    requiredMessage: string,
    typeMessage: string,
): ReportSectionValidationResult | null {
    if (value === undefined || value === null) {
        return { valid: false, error: requiredMessage, code: "VALIDATION_FAILED", field};
    }

    if (typeof value !== "string"){
        return { valid: false, error: typeMessage, code: "VALIDATION_FAILED", field};
    }

    return null;
}

export function validateReportSections(input: {
    vendor_summary?: unknown;
    delivery_performance?: unknown;
    pricing_analysis?: unknown;
    order_accuracy?: unknown;
    ai_overall_comparison?: unknown;
    ai_delivery_comparison?: unknown;
    ai_pricing_comparison?: unknown;
    ai_order_accuracy_comparison?: unknown;
  }): ReportSectionValidationResult {
    const vendorSummary = requireString(
      input.vendor_summary,
      "vendor_summary",
      "Vendor summary is required",
      "Vendor summary must be a string"
    );
    if (vendorSummary) return vendorSummary;
    const deliveryPerformance = requireString(
      input.delivery_performance,
      "delivery_performance",
      "Delivery performance is required",
      "Delivery performance must be a string"
    );
    if (deliveryPerformance) return deliveryPerformance;
    const pricingAnalysis = requireString(
      input.pricing_analysis,
      "pricing_analysis",
      "Pricing analysis is required",
      "Pricing analysis must be a string"
    );
    if (pricingAnalysis) return pricingAnalysis;
    const orderAccuracy = requireString(
      input.order_accuracy,
      "order_accuracy",
      "Order accuracy is required",
      "Order accuracy must be a string"
    );
    if (orderAccuracy) return orderAccuracy;

    const data: ReportSectionInput = {
      vendor_summary: input.vendor_summary as string,
      delivery_performance: input.delivery_performance as string,
      pricing_analysis: input.pricing_analysis as string,
      order_accuracy: input.order_accuracy as string,
    };

    // The four AI Comparative Analysis fields are optional here — present
    // only when the report actually has that section to edit (>= 2 vendors,
    // not a legacy draft; the UI simply never sends these keys otherwise).
    // When present, each must be a non-empty-type string, same requirement
    // as every other section; when absent, left out of `data` entirely so
    // updateReportSections' conditional SET leaves those columns untouched.
    const comparisonFields: [keyof ReportSectionInput, string, string][] = [
      ["ai_overall_comparison", "Overall comparison is required", "Overall comparison must be a string"],
      ["ai_delivery_comparison", "Delivery comparison is required", "Delivery comparison must be a string"],
      ["ai_pricing_comparison", "Pricing comparison is required", "Pricing comparison must be a string"],
      [
        "ai_order_accuracy_comparison",
        "Order accuracy comparison is required",
        "Order accuracy comparison must be a string",
      ],
    ];
    for (const [field, requiredMessage, typeMessage] of comparisonFields) {
      if (input[field] === undefined) continue;
      const result = requireString(input[field], field, requiredMessage, typeMessage);
      if (result) return result;
      data[field] = input[field] as string;
    }

    return { valid: true, data };
  }