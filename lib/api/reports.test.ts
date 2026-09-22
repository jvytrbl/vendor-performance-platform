import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchReports,
  createReport,
  fetchReport,
  updateReportSections,
  generateReport,
  finalizeReport,
  exportReport,
  type ReportInput,
} from "./reports";

function mockResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

describe("fetchReports", () => {
  it("returns the report list on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, {
        reports: [
          {
            id: 1,
            reference_number: "VPR-20260101-123456",
            period_type: "Quarterly",
            period_start: "2026-01-01",
            period_end: "2026-03-31",
            status: "Draft",
            created_at: "2026-04-01T00:00:00.000Z",
          },
        ],
      })
    );

    const result = await fetchReports("good.token");

    expect(fetch).toHaveBeenCalledWith("/api/reports", {
      headers: { Authorization: "Bearer good.token" },
    });
    expect(result).toHaveLength(1);
    expect(result[0].reference_number).toBe("VPR-20260101-123456");
  });

  it("throws with the server's error message when the request fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(401, { error: "Invalid or Expired token" })
    );

    await expect(fetchReports("bad.token")).rejects.toThrow(
      "Invalid or Expired token"
    );
  });
});

describe("createReport", () => {
  const input: ReportInput = {
    period_type: "Quarterly",
    period_start: "2026-01-01",
    period_end: "2026-03-31",
    vendor_ids: [1, 2],
  };

  it("returns outcome 'created' on 201", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(201, {
        data: {
          id: 7,
          reference_number: "VPR-20260101-123456",
          period_type: "Quarterly",
          period_start: "2026-01-01",
          period_end: "2026-03-31",
          status: "Draft",
        },
      })
    );

    const result = await createReport(input, "good.token");

    expect(fetch).toHaveBeenCalledWith("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer good.token",
      },
      body: JSON.stringify(input),
    });
    expect(result).toEqual({
      outcome: "created",
      report: {
        id: 7,
        reference_number: "VPR-20260101-123456",
        period_type: "Quarterly",
        period_start: "2026-01-01",
        period_end: "2026-03-31",
        status: "Draft",
      },
    });
  });

  it("returns outcome 'error' on 400 validation failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(400, {
        error: "At least one vendor must be selected",
        code: "VALIDATION_FAILED",
        field: "vendor_ids",
      })
    );

    const result = await createReport(input, "good.token");

    expect(result).toEqual({
      outcome: "error",
      error: "At least one vendor must be selected",
      code: "VALIDATION_FAILED",
      field: "vendor_ids",
    });
  });

  it("returns outcome 'error' on 404 when a selected vendor no longer exists", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(404, {
        error: "Vendor not found",
        code: "VENDOR_NOT_FOUND",
        field: "vendor_ids",
      })
    );

    const result = await createReport(input, "good.token");

    expect(result).toEqual({
      outcome: "error",
      error: "Vendor not found",
      code: "VENDOR_NOT_FOUND",
      field: "vendor_ids",
    });
  });
});

const sections = {
  vendor_summary: "Summary text",
  delivery_performance: "Delivery text",
  pricing_analysis: "Pricing text",
  order_accuracy: "Accuracy text",
};

describe("fetchReport", () => {
  it("returns the report detail on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, {
        data: {
          id: 7,
          status: "Draft",
          vendor_summary: "Summary text",
          metrics: [],
        },
      })
    );

    const result = await fetchReport(7, "good.token");

    expect(fetch).toHaveBeenCalledWith("/api/reports/7", {
      headers: { Authorization: "Bearer good.token" },
    });
    expect(result.id).toBe(7);
    expect(result.vendor_summary).toBe("Summary text");
  });
});

describe("updateReportSections", () => {
  it("returns the updated report on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, { data: { id: 7, status: "Draft", ...sections } })
    );

    const result = await updateReportSections(7, sections, "good.token");

    expect(fetch).toHaveBeenCalledWith("/api/reports/7", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer good.token",
      },
      body: JSON.stringify(sections),
    });
    expect(result.outcome).toBe("ok");
  });

  it("returns UNAUTHORIZED when the session has expired", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(401, {
        error: "Invalid or Expired token",
        code: "UNAUTHORIZED",
      })
    );

    const result = await updateReportSections(7, sections, "bad.token");

    expect(result).toEqual({
      outcome: "error",
      error: "Invalid or Expired token",
      code: "UNAUTHORIZED",
      field: undefined,
    });
  });
});

describe("generateReport", () => {
  it("returns the report when generation succeeds", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, {
        data: { id: 7, status: "Draft", vendor_summary: "On-time delivery was 100." },
      })
    );

    const result = await generateReport(7, "good.token");

    expect(fetch).toHaveBeenCalledWith("/api/reports/7/generate", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    expect(result.outcome).toBe("ok");
  });

  it("returns the error code when generation is already in progress", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, {
        error: "Generation is already in progress for this report",
        code: "GENERATION_IN_PROGRESS",
      })
    );

    const result = await generateReport(7, "good.token");

    expect(result).toEqual({
      outcome: "error",
      error: "Generation is already in progress for this report",
      code: "GENERATION_IN_PROGRESS",
    });
  });
});

describe("finalizeReport", () => {
  it("returns the finalized report on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, { data: { id: 7, status: "Finalized" } })
    );

    const result = await finalizeReport(7, "good.token");

    expect(fetch).toHaveBeenCalledWith("/api/reports/7/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    expect(result).toEqual({
      outcome: "ok",
      report: { id: 7, status: "Finalized" },
    });
  });
});

describe("exportReport", () => {
  it("returns the file blob and filename on success", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => blob,
      headers: {
        get: (name: string) =>
          name === "Content-Disposition"
            ? 'attachment; filename="VPR-20260101-123456.pdf"'
            : null,
      },
    } as Response);

    const result = await exportReport(7, "pdf", "good.token");

    expect(fetch).toHaveBeenCalledWith("/api/reports/7/export?format=pdf", {
      headers: { Authorization: "Bearer good.token" },
    });
    expect(result).toEqual({
      outcome: "file",
      blob,
      filename: "VPR-20260101-123456.pdf",
    });
  });

  it("returns the error code when the report is not finalized", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, {
        error: "Only a Finalized report can be exported",
        code: "REPORT_NOT_FINALIZED",
      })
    );

    const result = await exportReport(7, "docx", "good.token");

    expect(result).toEqual({
      outcome: "error",
      error: "Only a Finalized report can be exported",
      code: "REPORT_NOT_FINALIZED",
    });
  });
});
