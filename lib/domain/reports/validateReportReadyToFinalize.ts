export type FinalizeValidationResult =
  | { valid: true }
  | { valid: false; error: string; code: string; field: string };

function isEmpty(value: string | null): boolean {
  return value === null || value.trim() === "";
}

export interface ComparisonSections {
  ai_overall_comparison: string | null;
  ai_delivery_comparison: string | null;
  ai_pricing_comparison: string | null;
  ai_order_accuracy_comparison: string | null;
}

// A report whose four AI Comparative Analysis columns are all still NULL —
// either because it predates this feature (migration 005 added the columns
// with no backfill), or simply because it has never been (re)generated
// since. Such reports finalize exactly as they did before this feature
// existed; regenerating fills the columns in, and the report stops being
// "legacy" from that point on.
export function isLegacyComparisonDraft(sections: ComparisonSections): boolean {
  return (
    sections.ai_overall_comparison === null &&
    sections.ai_delivery_comparison === null &&
    sections.ai_pricing_comparison === null &&
    sections.ai_order_accuracy_comparison === null
  );
}

export function validateReportReadyToFinalize(
  sections: {
    vendor_summary: string | null;
    delivery_performance: string | null;
    pricing_analysis: string | null;
    order_accuracy: string | null;
  } & ComparisonSections,
  vendorCount: number
): FinalizeValidationResult {
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

  // The AI Comparative Analysis section is only required when it actually
  // applies: >= 2 vendors (otherwise it was never generated at all, by
  // design) AND not a legacy draft (which will never get backfilled).
  const comparisonRequired = vendorCount >= 2 && !isLegacyComparisonDraft(sections);

  if (comparisonRequired) {
    if (isEmpty(sections.ai_overall_comparison)) {
      return {
        valid: false,
        error: "Overall comparison cannot be empty",
        code: "VALIDATION_FAILED",
        field: "ai_overall_comparison",
      };
    }
    if (isEmpty(sections.ai_delivery_comparison)) {
      return {
        valid: false,
        error: "Delivery comparison cannot be empty",
        code: "VALIDATION_FAILED",
        field: "ai_delivery_comparison",
      };
    }
    if (isEmpty(sections.ai_pricing_comparison)) {
      return {
        valid: false,
        error: "Pricing comparison cannot be empty",
        code: "VALIDATION_FAILED",
        field: "ai_pricing_comparison",
      };
    }
    if (isEmpty(sections.ai_order_accuracy_comparison)) {
      return {
        valid: false,
        error: "Order accuracy comparison cannot be empty",
        code: "VALIDATION_FAILED",
        field: "ai_order_accuracy_comparison",
      };
    }
  }

  return { valid: true };
}
