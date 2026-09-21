export type FinalizeValidationResult =
  | { valid: true }
  | { valid: false; error: string; code: string; field: string };

function isEmpty(value: string | null): boolean {
  return value === null || value.trim() === "";
}

export function validateReportReadyToFinalize(sections: {
  vendor_summary: string | null;
  delivery_performance: string | null;
  pricing_analysis: string | null;
  order_accuracy: string | null;
}): FinalizeValidationResult {
  if (isEmpty(sections.vendor_summary)) {
    return {
      valid: false,
      error: "Vendor summary cannot be empty",
      code: "VALIDATION_FAILED",
      field: "vendor_summary",
    };
  }
  if (isEmpty(sections.delivery_performance)) {
    return {
      valid: false,
      error: "Delivery performance cannot be empty",
      code: "VALIDATION_FAILED",
      field: "delivery_performance",
    };
  }
  if (isEmpty(sections.pricing_analysis)) {
    return {
      valid: false,
      error: "Pricing analysis cannot be empty",
      code: "VALIDATION_FAILED",
      field: "pricing_analysis",
    };
  }
  if (isEmpty(sections.order_accuracy)) {
    return {
      valid: false,
      error: "Order accuracy cannot be empty",
      code: "VALIDATION_FAILED",
      field: "order_accuracy",
    };
  }

  return { valid: true };
}