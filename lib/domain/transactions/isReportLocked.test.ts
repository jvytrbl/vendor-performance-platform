import { expect, it, describe } from "vitest";
import { isReportLocked } from "./isReportLocked";

describe("isReportLocked", () => {
    it("returns locked:false when there are no finalized reports at all", () => {
        const result = isReportLocked(1, "2026-05-01", []);
        expect(result).toEqual({ locked: false });
    });

    it("returns locked:true with the report's reference number when the transaction date falls within a finalized report's range and the vendor is included", () => {
        const result = isReportLocked(1, "2026-06-15", [
          { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: [1, 2] },
        ]);
        expect(result).toEqual({ locked: true, referenceNumber: "RPT-2026-Q2-001" });
      });
      it("returns locked:false when the date matches but the vendor is not in that report", () => {
        const result = isReportLocked(3, "2026-06-15", [
          { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: [1, 2] },
        ]);
        expect(result).toEqual({ locked: false });
      });
      it("returns locked:true when the transaction date is exactly period_start", () => {
        const result = isReportLocked(1, "2026-06-01", [
          { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: [1] },
        ]);
        expect(result).toEqual({ locked: true, referenceNumber: "RPT-2026-Q2-001" });
      });
      it("returns locked:true when the transaction date is exactly period_end", () => {
        const result = isReportLocked(1, "2026-06-30", [
          { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: [1] },
        ]);
        expect(result).toEqual({ locked: true, referenceNumber: "RPT-2026-Q2-001" });
      });
      it("returns locked:false when the transaction date is one day before period_start", () => {
        const result = isReportLocked(1, "2026-05-31", [
          { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: [1] },
        ]);
        expect(result).toEqual({ locked: false });
      });
      it("returns locked:false when the transaction date is one day after period_end", () => {
        const result = isReportLocked(1, "2026-07-01", [
          { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: [1] },
        ]);
        expect(result).toEqual({ locked: false });
      });
});