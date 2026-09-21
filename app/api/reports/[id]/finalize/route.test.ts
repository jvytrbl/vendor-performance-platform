import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { validateAuthHeader } from "../../../../../lib/auth";
import { getReportById, finalizeReport } from "@/lib/repositories/reports";

vi.mock("../../../../../lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/reports", () => ({
  getReportById: vi.fn(),
  finalizeReport: vi.fn(),
}));

const draft = {
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
  vendor_ids: [1, 2],
  metrics: [],
};

describe("POST /api/reports/:id/finalize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/reports/7/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer bad.token" },
    });
    const response = await POST(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Invalid or Expired token",
      code: "UNAUTHORIZED",
    });
  });

  it("returns 400 when the id is not a positive integer", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const request = new Request("http://localhost/api/reports/abc/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    const response = await POST(request, { params: Promise.resolve({ id: "abc" }) });
    const body = await response.json();

    expect(finalizeReport).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Report id must be a positive integer",
      code: "VALIDATION_FAILED",
      field: "id",
    });
  });

  it("returns 404 when the report does not exist", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue(null);

    const request = new Request("http://localhost/api/reports/99/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    const response = await POST(request, { params: Promise.resolve({ id: "99" }) });
    const body = await response.json();

    expect(finalizeReport).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Report not found",
      code: "REPORT_NOT_FOUND",
      field: "id",
    });
  });

  it("returns 409 when the report is already Finalized", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue({
      ...draft,
      status: "Finalized",
    } as any);

    const request = new Request("http://localhost/api/reports/7/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    const response = await POST(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(finalizeReport).not.toHaveBeenCalled();
    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "Report is already finalized",
      code: "REPORT_FINALIZED",
      field: "id",
    });
  });

  it("returns 400 when a section is empty", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue({
      ...draft,
      vendor_summary: "   ",
    } as any);

    const request = new Request("http://localhost/api/reports/7/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    const response = await POST(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(finalizeReport).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Vendor summary cannot be empty",
      code: "VALIDATION_FAILED",
      field: "vendor_summary",
    });
  });

  it("finalizes the report and returns 200 when it is a complete Draft", async () => {
    const finalized = {
      ...draft,
      status: "Finalized",
      finalized_at: "2026-04-02T00:00:00.000Z",
    };
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue(draft as any);
    vi.mocked(finalizeReport).mockResolvedValue(finalized as any);

    const request = new Request("http://localhost/api/reports/7/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    const response = await POST(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(finalizeReport).toHaveBeenCalledWith(7);
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: finalized });
  });
});