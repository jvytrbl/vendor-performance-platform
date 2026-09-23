import { describe, it, expect, vi } from "vitest";
import { insertReport, listReports, getReportById, updateReportSections, deleteReport, finalizeReport, saveGeneratedReport, tryStartGeneration, clearGenerationStatus } from "./reports";
import { getDbPool } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  getDbPool: vi.fn(),
}));

const input = {
  period_type: "Quarterly" as const,
  period_start: "2026-01-01",
  period_end: "2026-03-31",
  vendor_ids: [1, 2],
};

const reportRow = {
  id: 7,
  reference_number: "VPR-20260101-123456",
  period_type: "Quarterly",
  period_start: "2026-01-01",
  period_end: "2026-03-31",
  status: "Draft",
  vendor_summary: "Summary text",
  delivery_performance: "Delivery text",
  pricing_analysis: "Pricing text",
  order_accuracy: "Accuracy text",
  created_at: "2026-04-01T00:00:00.000Z",
  finalized_at: null,
};
const metricRow = {
  vendor_id: 1,
  period_start: "2026-01-01",
  period_end: "2026-03-31",
  on_time_delivery_rate: 80,
  avg_delay_days: 1.5,
  overcharge_rate: 10,
  avg_overcharge_pct: 2.5,
  undercharge_rate: 0,
  shortfall_rate: 5,
  avg_shortfall_units: 1,
  overdelivery_rate: 0,
  avg_overdelivery_units: 0,
  transaction_count: 10,
};

describe("insertReport", () => {
  it("inserts a Draft report and one row per selected vendor, then returns the created record", async () => {
    const createdRow = {
      id: 7,
      reference_number: "VPR-20260101-123456",
      period_type: "Quarterly",
      period_start: "2026-01-01",
      period_end: "2026-03-31",
      status: "Draft",
    };

    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes("VENDOR_PERFORMANCE_REPORTS")) {
        return { recordset: [createdRow] };
      }
      return { recordset: [], rowsAffected: [1] };
    });

    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    const result = await insertReport(input);

    expect(mockRequest.input).toHaveBeenCalledWith("period_type", "Quarterly");
    expect(mockRequest.input).toHaveBeenCalledWith("period_start", "2026-01-01");
    expect(mockRequest.input).toHaveBeenCalledWith("period_end", "2026-03-31");
    expect(mockRequest.input).toHaveBeenCalledWith("status", "Draft");
    expect(mockRequest.input).toHaveBeenCalledWith("report_id", 7);
    expect(mockRequest.input).toHaveBeenCalledWith("vendor_id", 1);
    expect(mockRequest.input).toHaveBeenCalledWith("vendor_id", 2);
    expect(result).toEqual({
      ...createdRow,
      vendor_ids: [1, 2],
    });
  });
});

describe("listReports", () => {
  it("returns one page and the total, including an empty page past the end", async () => {
    const request: any = {};
    request.input = vi.fn().mockReturnValue(request);
    request.query = vi
      .fn()
      .mockResolvedValueOnce({ recordset: [{ total: 31 }] })
      .mockResolvedValueOnce({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    const result = await listReports({ limit: 15, offset: 45 });

    expect(request.input).toHaveBeenCalledWith("offset", 45);
    expect(request.input).toHaveBeenCalledWith("limit", 15);
    expect(request.query.mock.calls[1][0]).toContain("OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY");
    expect(result).toEqual({ reports: [], total: 31 });
  });
});

describe("getReportById", () => {
  it("returns null when the report does not exist", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);
    const result = await getReportById(99);
    expect(mockRequest.input).toHaveBeenCalledWith("id", 99);
    expect(result).toBeNull();
  });
  it("returns the report with vendor_ids and metrics when found", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes("VENDOR_PERFORMANCE_METRICS")) {
        return { recordset: [metricRow] };
      }
      if (sql.includes("VENDOR_PERFORMANCE_REPORT_VENDORS")) {
        return { recordset: [{ vendor_id: 1 }, { vendor_id: 2 }] };
      }
      return { recordset: [reportRow] };
    });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);
    const result = await getReportById(7);
    expect(mockRequest.input).toHaveBeenCalledWith("id", 7);
    expect(result).toEqual({
      ...reportRow,
      vendor_ids: [1, 2],
      metrics: [metricRow],
    });
  });

  // Regression: generation stores one row per vendor for the current period
  // AND one for the prior-period comparison, both under the same report_id
  // (UQ_VPM_report_vendor_period is keyed on report_id + vendor_id +
  // period_start, not just report_id + vendor_id). Filtering by report_id
  // alone returns both rows per vendor — the metrics query must also pin
  // period_start to the report's own period.
  it("filters the metrics query to the report's own period_start, not just its report_id", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    let metricsQuerySql = "";
    mockRequest.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes("VENDOR_PERFORMANCE_METRICS")) {
        metricsQuerySql = sql;
        return { recordset: [metricRow] };
      }
      if (sql.includes("VENDOR_PERFORMANCE_REPORT_VENDORS")) {
        return { recordset: [{ vendor_id: 1 }] };
      }
      return { recordset: [reportRow] };
    });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    await getReportById(7);

    expect(mockRequest.input).toHaveBeenCalledWith("period_start", reportRow.period_start);
    expect(metricsQuerySql).toContain("report_id = @id");
    expect(metricsQuerySql).toContain("period_start = @period_start");
  });
});

describe("updateReportSections", () => {
  it("updates the four section fields and returns the updated row", async () => {
    const sections = {
      vendor_summary: "Updated summary",
      delivery_performance: "Updated delivery",
      pricing_analysis: "Updated pricing",
      order_accuracy: "Updated accuracy",
    };
    const updatedRow = { ...reportRow, ...sections };
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({ recordset: [updatedRow] });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);
    const result = await updateReportSections(7, sections);
    expect(mockRequest.input).toHaveBeenCalledWith("id", 7);
    expect(mockRequest.input).toHaveBeenCalledWith("vendor_summary", "Updated summary");
    expect(mockRequest.input).toHaveBeenCalledWith("delivery_performance", "Updated delivery");
    expect(mockRequest.input).toHaveBeenCalledWith("pricing_analysis", "Updated pricing");
    expect(mockRequest.input).toHaveBeenCalledWith("order_accuracy", "Updated accuracy");
    expect(result).toEqual(updatedRow);
  });
});

describe("deleteReport", () => {
  it("deletes the report by id and returns the number of rows affected", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({ rowsAffected: [1] });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    const result = await deleteReport(7);

    expect(mockRequest.input).toHaveBeenCalledWith("id", 7);
    expect(mockRequest.query).toHaveBeenCalledWith(
      "DELETE FROM VENDOR_PERFORMANCE_REPORTS WHERE id = @id"
    );
    expect(result).toBe(1);
  });
});

describe("finalizeReport", () => {
  it("sets status to Finalized and stamps finalized_at", async () => {
    const finalizedRow = {
      ...reportRow,
      status: "Finalized",
      finalized_at: "2026-04-02T00:00:00.000Z",
    };
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({ recordset: [finalizedRow] });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    const result = await finalizeReport(7);

    expect(mockRequest.input).toHaveBeenCalledWith("id", 7);
    expect(mockRequest.input).toHaveBeenCalledWith("status", "Finalized");
    expect(mockRequest.query.mock.calls[0][0]).toContain("finalized_at = GETUTCDATE()");
    expect(result).toEqual(finalizedRow);
  });
});

describe("saveGeneratedReport", () => {
  it("updates the four sections and inserts one metrics row per period", async () => {
    const sections = {
      vendor_summary: "On-time delivery was 100.",
      delivery_performance: "On-time delivery was 100.",
      pricing_analysis: "On-time delivery was 100.",
      order_accuracy: "On-time delivery was 100.",
    };
    const metrics = [
      {
        vendor_id: 1,
        period_start: "2026-01-01",
        period_end: "2026-03-31",
        on_time_delivery_rate: 100,
        avg_delay_days: 0,
        overcharge_rate: 0,
        avg_overcharge_pct: 0,
        undercharge_rate: 0,
        shortfall_rate: 0,
        avg_shortfall_units: 0,
        overdelivery_rate: 0,
        avg_overdelivery_units: 0,
        transaction_count: 1,
      },
    ];
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes("UPDATE VENDOR_PERFORMANCE_REPORTS")) {
        return { recordset: [{ ...reportRow, ...sections }] };
      }
      return { recordset: [], rowsAffected: [1] };
    });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    await saveGeneratedReport(7, sections, metrics);

    expect(mockRequest.input).toHaveBeenCalledWith("vendor_summary", sections.vendor_summary);
    expect(mockRequest.input).toHaveBeenCalledWith("report_id", 7);
    expect(mockRequest.input).toHaveBeenCalledWith("on_time_delivery_rate", 100);
    expect(mockRequest.input).toHaveBeenCalledWith("transaction_count", 1);
    expect(
      mockRequest.query.mock.calls.some((call: string[]) =>
        call[0].includes("INSERT INTO VENDOR_PERFORMANCE_METRICS")
      )
    ).toBe(true);
  });
});

describe("tryStartGeneration", () => {
  // Category 7 (concurrency): the claim must be one atomic UPDATE whose
  // WHERE clause re-checks generation_status in the same statement as the
  // write, so two concurrent calls can't both read "idle" before either
  // writes "InProgress".
  it("claims the report and returns true when generation_status is idle (NULL or not InProgress)", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({ rowsAffected: [1] });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    const result = await tryStartGeneration(7);

    expect(mockRequest.input).toHaveBeenCalledWith("id", 7);
    const sql = mockRequest.query.mock.calls[0][0] as string;
    expect(sql).toContain("SET generation_status = 'InProgress'");
    expect(sql).toContain("WHERE id = @id");
    expect(sql).toContain("generation_status IS NULL OR generation_status <> 'InProgress'");
    expect(result).toBe(true);
  });

  it("returns false without claiming when another request already has it InProgress", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({ rowsAffected: [0] });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    const result = await tryStartGeneration(7);

    expect(result).toBe(false);
  });
});

describe("clearGenerationStatus", () => {
  it("resets generation_status back to idle (NULL)", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({ rowsAffected: [1] });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    await clearGenerationStatus(7);

    expect(mockRequest.input).toHaveBeenCalledWith("id", 7);
    const sql = mockRequest.query.mock.calls[0][0] as string;
    expect(sql).toContain("SET generation_status = NULL");
    expect(sql).toContain("WHERE id = @id");
  });
});