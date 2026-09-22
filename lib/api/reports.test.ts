import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchReports, createReport, type ReportInput } from "./reports";

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
