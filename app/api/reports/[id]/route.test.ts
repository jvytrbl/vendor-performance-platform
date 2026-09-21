import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";
import { validateAuthHeader } from "../../../../lib/auth";
import { getReportById, updateReportSections, deleteReport } from "@/lib/repositories/reports";

vi.mock("../../../../lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/reports", () => ({
  getReportById: vi.fn(),
  updateReportSections: vi.fn(),
  deleteReport: vi.fn(),
}));


const report = {
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

const validBody = {
  vendor_summary: "Updated summary",
  delivery_performance: "Updated delivery",
  pricing_analysis: "Updated pricing",
  order_accuracy: "Updated accuracy",
};

describe("GET /api/reports/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/reports/7");
    const response = await GET(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Invalid or Expired token",
      code: "UNAUTHORIZED",
    });
  });

  it("returns 400 when the id is not a positive integer", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const request = new Request("http://localhost/api/reports/abc");
    const response = await GET(request, { params: Promise.resolve({ id: "abc" }) });
    const body = await response.json();

    expect(getReportById).not.toHaveBeenCalled();
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

    const request = new Request("http://localhost/api/reports/99");
    const response = await GET(request, { params: Promise.resolve({ id: "99" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Report not found",
      code: "REPORT_NOT_FOUND",
      field: "id",
    });
  });

  it("returns 200 with sections and metrics when found", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue(report as any);

    const request = new Request("http://localhost/api/reports/7");
    const response = await GET(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(getReportById).toHaveBeenCalledWith(7);
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: report });
  });
});

describe("PUT /api/reports/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/reports/7", {
      method: "PUT",
      headers: { Authorization: "Bearer bad.token" },
      body: JSON.stringify(validBody),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Invalid or Expired token",
      code: "UNAUTHORIZED",
    });
  });

  it("returns 400 when the id is not a positive integer", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const request = new Request("http://localhost/api/reports/abc", {
      method: "PUT",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify(validBody),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: "abc" }) });
    const body = await response.json();

    expect(updateReportSections).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Report id must be a positive integer",
      code: "VALIDATION_FAILED",
      field: "id",
    });
  });

  it("returns 400 when a section field is invalid", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const request = new Request("http://localhost/api/reports/7", {
      method: "PUT",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify({ ...validBody, vendor_summary: undefined }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(updateReportSections).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Vendor summary is required",
      code: "VALIDATION_FAILED",
      field: "vendor_summary",
    });
  });

  it("returns 404 when the report does not exist", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue(null);

    const request = new Request("http://localhost/api/reports/99", {
      method: "PUT",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify(validBody),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: "99" }) });
    const body = await response.json();

    expect(updateReportSections).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Report not found",
      code: "REPORT_NOT_FOUND",
      field: "id",
    });
  });

  it("returns 409 when the report is Finalized", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue({
      ...report,
      status: "Finalized",
    } as any);

    const request = new Request("http://localhost/api/reports/7", {
      method: "PUT",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify(validBody),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(updateReportSections).not.toHaveBeenCalled();
    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "Finalized reports cannot be edited",
      code: "REPORT_FINALIZED",
      field: "id",
    });
  });

  it("updates the sections and returns 200 when the report is Draft", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getReportById).mockResolvedValue(report as any);
    vi.mocked(updateReportSections).mockResolvedValue({
      ...report,
      ...validBody,
    } as any);

    const request = new Request("http://localhost/api/reports/7", {
      method: "PUT",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify(validBody),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(updateReportSections).toHaveBeenCalledWith(7, validBody);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        ...report,
        ...validBody,
      },
    });
  });
});

describe("DELETE /api/reports/:id", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
  
    it("returns 401 when the request is not authenticated", async () => {
      vi.mocked(validateAuthHeader).mockResolvedValue({
        valid: false,
        reason: "Invalid or Expired token",
      });
  
      const request = new Request("http://localhost/api/reports/7", {
        method: "DELETE",
        headers: { Authorization: "Bearer bad.token" },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "7" }) });
      const body = await response.json();
  
      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: "Invalid or Expired token",
        code: "UNAUTHORIZED",
      });
    });
  
    it("returns 400 when the id is not a positive integer", async () => {
      vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
  
      const request = new Request("http://localhost/api/reports/abc", {
        method: "DELETE",
        headers: { Authorization: "Bearer good.token" },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "abc" }) });
      const body = await response.json();
  
      expect(deleteReport).not.toHaveBeenCalled();
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
  
      const request = new Request("http://localhost/api/reports/99", {
        method: "DELETE",
        headers: { Authorization: "Bearer good.token" },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "99" }) });
      const body = await response.json();
  
      expect(deleteReport).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(body).toEqual({
        error: "Report not found",
        code: "REPORT_NOT_FOUND",
        field: "id",
      });
    });
  
    it("returns 409 when the report is Finalized", async () => {
      vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
      vi.mocked(getReportById).mockResolvedValue({
        ...report,
        status: "Finalized",
      } as any);
  
      const request = new Request("http://localhost/api/reports/7", {
        method: "DELETE",
        headers: { Authorization: "Bearer good.token" },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "7" }) });
      const body = await response.json();
  
      expect(deleteReport).not.toHaveBeenCalled();
      expect(response.status).toBe(409);
      expect(body).toEqual({
        error: "Finalized reports cannot be deleted",
        code: "REPORT_FINALIZED",
        field: "id",
      });
    });
  
    it("deletes the report and returns 200 when it is Draft", async () => {
      vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
      vi.mocked(getReportById).mockResolvedValue(report as any);
      vi.mocked(deleteReport).mockResolvedValue(1);
  
      const request = new Request("http://localhost/api/reports/7", {
        method: "DELETE",
        headers: { Authorization: "Bearer good.token" },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "7" }) });
      const body = await response.json();
  
      expect(deleteReport).toHaveBeenCalledWith(7);
      expect(response.status).toBe(200);
      expect(body).toEqual({ ok: true });
    });
  });