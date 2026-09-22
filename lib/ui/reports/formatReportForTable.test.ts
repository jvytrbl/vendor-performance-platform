import { describe, it, expect } from "vitest";
import { formatReportForTable } from "./formatReportForTable";

describe("formatReportForTable", () => {
  it("formats a report record into display-ready fields", () => {
    const result = formatReportForTable({
      id: 7,
      reference_number: "VPR-20260101-123456",
      period_type: "Quarterly",
      period_start: "2026-01-01",
      period_end: "2026-03-31",
      status: "Draft",
      created_at: "2026-04-01T00:00:00.000Z",
    });

    expect(result).toEqual({
      id: 7,
      referenceNumber: "VPR-20260101-123456",
      periodType: "Quarterly",
      period: "01 Jan 2026 – 31 Mar 2026",
      status: "Draft",
      createdAt: "01 Apr 2026",
    });
  });

  it("falls back to a placeholder when created_at is missing or invalid", () => {
    const result = formatReportForTable({
      id: 7,
      reference_number: "VPR-20260101-123456",
      period_type: "Quarterly",
      period_start: "2026-01-01",
      period_end: "2026-03-31",
      status: "Draft",
      created_at: "",
    });

    expect(result.createdAt).toBe("—");
  });
});
