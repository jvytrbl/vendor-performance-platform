export interface ReportSectionInput {
    vendor_summary: string;
    delivery_performance:  string;
    pricing_analysis: string;
    order_accuracy: string;
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
    return {
      valid: true,
      data: {
        vendor_summary: input.vendor_summary as string,
        delivery_performance: input.delivery_performance as string,
        pricing_analysis: input.pricing_analysis as string,
        order_accuracy: input.order_accuracy as string,
      },
    };
  }