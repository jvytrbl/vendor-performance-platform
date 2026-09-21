export interface ReportInput {
    period_type: "Quarterly" | "Custom";
    period_start: string;
    period_end:  string;
    vendor_ids: number[];
}

export type ReportValidationResult =
    | { valid: true, data: ReportInput}
    | { valid: false, error: string; code: string; field: string;};

function requireField (
    value: unknown,
    field:  string,
    message: string,
): ReportValidationResult | null {
    if(value === undefined || value === null || value === "") {
        return {
            valid: false,
            error: message,
            code: "VALIDATION_FAILED",
            field,
        };
    }
    return null;
}

function parseIsoDate( value: string):  Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if(
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}

export function validateReportInput(input: ReportInput): ReportValidationResult {
    const periodTypeRequired = requireField(
        input.period_type,
        "period_type",
        "Period type is required"
      );
      if (periodTypeRequired) return periodTypeRequired;
      if (input.period_type !== "Quarterly" && input.period_type !== "Custom") {
        return {
          valid: false,
          error: "Period type must be Quarterly or Custom",
          code: "VALIDATION_FAILED",
          field: "period_type",
        };
      }
      const periodStartRequired = requireField(
        input.period_start,
        "period_start",
        "Period start is required"
      );
      if (periodStartRequired) return periodStartRequired;
      const periodStart = parseIsoDate(input.period_start);
      if (!periodStart) {
        return {
          valid: false,
          error: "Period start must be a valid date",
          code: "VALIDATION_FAILED",
          field: "period_start",
        };
      }
      const periodEndRequired = requireField(
        input.period_end,
        "period_end",
        "Period end is required"
      );
      if (periodEndRequired) return periodEndRequired;
      const periodEnd = parseIsoDate(input.period_end);
      if (!periodEnd) {
        return {
          valid: false,
          error: "Period end must be a valid date",
          code: "VALIDATION_FAILED",
          field: "period_end",
        };
      }
      if (periodEnd < periodStart) {
        return {
          valid: false,
          error: "Period end cannot be before period start",
          code: "VALIDATION_FAILED",
          field: "period_end",
        };
      }
      if (!Array.isArray(input.vendor_ids) || input.vendor_ids.length === 0) {
        return {
          valid: false,
          error: "At least one vendor must be selected",
          code: "VALIDATION_FAILED",
          field: "vendor_ids",
        };
      }
      if (
        input.vendor_ids.some(
          (id) => typeof id !== "number" || !Number.isInteger(id) || id <= 0
        )
      ) {
        return {
          valid: false,
          error: "Each vendor id must be a positive integer",
          code: "VALIDATION_FAILED",
          field: "vendor_ids",
        };
      }
      if (new Set(input.vendor_ids).size !== input.vendor_ids.length) {
        return {
          valid: false,
          error: "Vendor list must not contain duplicates",
          code: "VALIDATION_FAILED",
          field: "vendor_ids",
        };
      }
      return { valid: true, data: input };
}