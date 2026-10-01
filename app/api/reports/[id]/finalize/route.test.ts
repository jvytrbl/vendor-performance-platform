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

vi.mock("@/lib/audit/withAudit", () => ({
  withAudit: vi.fn((_params: unknown, mutate: (executor: unknown) => unknown) => mutate({})),
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
  ai_overall_comparison: null,
  ai_delivery_comparison: null,
  ai_pricing_comparison: null,
  ai_order_accuracy_comparison: null,
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
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: true,
      email: "test.user@envirosgroup.com",
      oid: "11111111-1111-1111-1111-111111111111",
      tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    });

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
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: true,
      email: "test.user@envirosgroup.com",
      oid: "11111111-1111-1111-1111-111111111111",
      tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    });
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
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: true,
      email: "test.user@envirosgroup.com",
      oid: "11111111-1111-1111-1111-111111111111",
      tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    });
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
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: true,
      email: "test.user@envirosgroup.com",
      oid: "11111111-1111-1111-1111-111111111111",
      tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    });
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
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: true,
      email: "test.user@envirosgroup.com",
      oid: "11111111-1111-1111-1111-111111111111",
      tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    });
    vi.mocked(getReportById).mockResolvedValue(draft as any);
    vi.mocked(finalizeReport).mockResolvedValue(finalized as any);

    const request = new Request("http://localhost/api/reports/7/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    const response = await POST(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(finalizeReport).toHaveBeenCalledWith(7, {});
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: finalized });
  });

  it("finalizes a legacy draft (all four comparison columns null) with 2+ vendors and no acknowledgement", async () => {
    // `draft` above has vendor_ids: [1, 2] and all four comparison columns
    // null — this is exactly the legacy-draft exemption, and it's already
    // exercised by the "finalizes the report" test above with no body at
    // all. This test makes that exemption explicit as its own case.
    const finalized = { ...draft, status: "Finalized" };
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: true,
      email: "test.user@envirosgroup.com",
      oid: "11111111-1111-1111-1111-111111111111",
      tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    });
    vi.mocked(getReportById).mockResolvedValue(draft as any);
    vi.mocked(finalizeReport).mockResolvedValue(finalized as any);

    const request = new Request("http://localhost/api/reports/7/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    const response = await POST(request, { params: Promise.resolve({ id: "7" }) });

    expect(response.status).toBe(200);
    expect(finalizeReport).toHaveBeenCalledWith(7, {});
  });

  it("finalizes a 1-vendor report with the comparison columns null and no acknowledgement", async () => {
    const oneVendor = { ...draft, vendor_ids: [1] };
    const finalized = { ...oneVendor, status: "Finalized" };
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: true,
      email: "test.user@envirosgroup.com",
      oid: "11111111-1111-1111-1111-111111111111",
      tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    });
    vi.mocked(getReportById).mockResolvedValue(oneVendor as any);
    vi.mocked(finalizeReport).mockResolvedValue(finalized as any);

    const request = new Request("http://localhost/api/reports/7/finalize", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
    });
    const response = await POST(request, { params: Promise.resolve({ id: "7" }) });

    expect(response.status).toBe(200);
    expect(finalizeReport).toHaveBeenCalledWith(7, {});
  });

  it("returns 400 with COMPARISON_NOT_ACKNOWLEDGED when a non-legacy, 2+ vendor report is finalized without acknowledging the comparison review", async () => {
    const notLegacy = {
      ...draft,
      ai_overall_comparison: "Vendor A outperforms Vendor B overall.",
      ai_delivery_comparison: "Vendor A has the better delivery record.",
      ai_pricing_comparison: "Vendor B is cheaper on average.",
      ai_order_accuracy_comparison: "Both vendors are tied on order accuracy.",
    };
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: true,
      email: "test.user@envirosgroup.com",
      oid: "11111111-1111-1111-1111-111111111111",
      tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    });
    vi.mocked(getReportById).mockResolvedValue(notLegacy as any);

    const request = new Request("http://localhost/api/reports/7/finalize", {
      method: "POST",
      headers: {
        Authorization: "Bearer good.token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ acknowledgedComparisonReview: false }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(finalizeReport).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(body).toEqual({
      error:
        "You must confirm you have reviewed the AI Comparative Analysis before finalizing",
      code: "COMPARISON_NOT_ACKNOWLEDGED",
      field: "acknowledgedComparisonReview",
    });
  });

  it("finalizes a non-legacy, 2+ vendor report when the comparison review is acknowledged", async () => {
    const notLegacy = {
      ...draft,
      ai_overall_comparison: "Vendor A outperforms Vendor B overall.",
      ai_delivery_comparison: "Vendor A has the better delivery record.",
      ai_pricing_comparison: "Vendor B is cheaper on average.",
      ai_order_accuracy_comparison: "Both vendors are tied on order accuracy.",
    };
    const finalized = { ...notLegacy, status: "Finalized" };
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: true,
      email: "test.user@envirosgroup.com",
      oid: "11111111-1111-1111-1111-111111111111",
      tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
    });
    vi.mocked(getReportById).mockResolvedValue(notLegacy as any);
    vi.mocked(finalizeReport).mockResolvedValue(finalized as any);

    const request = new Request("http://localhost/api/reports/7/finalize", {
      method: "POST",
      headers: {
        Authorization: "Bearer good.token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ acknowledgedComparisonReview: true }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: "7" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: finalized });
    expect(finalizeReport).toHaveBeenCalledWith(7, {});
  });
});