import { describe, it, expect } from "vitest";
import { validateReportInput } from "./validateReportInput";

const validInput = {
    period_type: "Quarterly" as const,
    period_start: "2026-01-01",
    period_end:"2026-03-31",
    vendor_ids: [1,2],
};

describe("validateReportInput", () => {
    it("accepts a quarterly report with a valid date range and at least one vendor", () => {
        const result = validateReportInput(validInput);
        expect(result).toEqual( { valid: true, data: validInput});
    });

    it("accepts a custom one-day period", () => {
        const input = {
          ...validInput,
          period_type: "Custom" as const,
          period_start: "2026-06-15",
          period_end: "2026-06-15",
        };
        expect(validateReportInput(input)).toEqual({ valid: true, data: input });
      });
      it("rejects a period_type that is not Quarterly or Custom", () => {
        const result = validateReportInput({
          ...validInput,
          period_type: "Monthly",
        } as any);
        expect(result).toEqual({
          valid: false,
          error: "Period type must be Quarterly or Custom",
          code: "VALIDATION_FAILED",
          field: "period_type",
        });
      });
      it("rejects a missing period_start", () => {
        const { period_start: _ignored, ...rest } = validInput;
        const result = validateReportInput(rest as any);
        expect(result).toEqual({
          valid: false,
          error: "Period start is required",
          code: "VALIDATION_FAILED",
          field: "period_start",
        });
      });
      it("rejects an invalid period_start", () => {
        const result = validateReportInput({
          ...validInput,
          period_start: "2026-02-30",
        });
        expect(result).toEqual({
          valid: false,
          error: "Period start must be a valid date",
          code: "VALIDATION_FAILED",
          field: "period_start",
        });
      });
      it("rejects a missing period_end", () => {
        const { period_end: _ignored, ...rest } = validInput;
        const result = validateReportInput(rest as any);
        expect(result).toEqual({
          valid: false,
          error: "Period end is required",
          code: "VALIDATION_FAILED",
          field: "period_end",
        });
      });
      it("rejects an invalid period_end", () => {
        const result = validateReportInput({
          ...validInput,
          period_end: "not-a-date",
        });
        expect(result).toEqual({
          valid: false,
          error: "Period end must be a valid date",
          code: "VALIDATION_FAILED",
          field: "period_end",
        });
      });
      it("rejects a period_end that is before period_start", () => {
        const result = validateReportInput({
          ...validInput,
          period_start: "2026-03-31",
          period_end: "2026-01-01",
        });
        expect(result).toEqual({
          valid: false,
          error: "Period end cannot be before period start",
          code: "VALIDATION_FAILED",
          field: "period_end",
        });
      });
      it("rejects a missing vendor list", () => {
        const { vendor_ids: _ignored, ...rest } = validInput;
        const result = validateReportInput(rest as any);
        expect(result).toEqual({
          valid: false,
          error: "At least one vendor must be selected",
          code: "VALIDATION_FAILED",
          field: "vendor_ids",
        });
      });
      it("rejects an empty vendor list", () => {
        const result = validateReportInput({
          ...validInput,
          vendor_ids: [],
        });
        expect(result).toEqual({
          valid: false,
          error: "At least one vendor must be selected",
          code: "VALIDATION_FAILED",
          field: "vendor_ids",
        });
      });
      it("rejects a vendor id that is not a positive integer", () => {
        const result = validateReportInput({
          ...validInput,
          vendor_ids: [1, 0],
        });
        expect(result).toEqual({
          valid: false,
          error: "Each vendor id must be a positive integer",
          code: "VALIDATION_FAILED",
          field: "vendor_ids",
        });
      });
      it("rejects a duplicated vendor id", () => {
        const result = validateReportInput({
          ...validInput,
          vendor_ids: [1, 2, 1],
        });
        expect(result).toEqual({
          valid: false,
          error: "Vendor list must not contain duplicates",
          code: "VALIDATION_FAILED",
          field: "vendor_ids",
        });
      });
});