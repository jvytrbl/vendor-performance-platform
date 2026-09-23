import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { validateAuthHeader } from "../../../lib/auth";
import { insertReport, listReports } from "@/lib/repositories/reports";
import { getVendorById } from "@/lib/repositories/vendors";

vi.mock("../../../lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/reports", () => ({
  insertReport: vi.fn(),
  listReports: vi.fn(),
}));

vi.mock("@/lib/repositories/vendors", () => ({
  getVendorById: vi.fn(),
}));

const validBody = {
  period_type: "Quarterly",
  period_start: "2026-01-01",
  period_end: "2026-03-31",
  vendor_ids: [1, 2],
};

describe("POST /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { Authorization: "Bearer bad.token" },
      body: JSON.stringify(validBody),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Invalid or Expired token",
      code: "UNAUTHORIZED",
    });
  });

  it("returns 400 with the validation error when the report input is invalid", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const request = new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify({ ...validBody, vendor_ids: [] }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(insertReport).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "At least one vendor must be selected",
      code: "VALIDATION_FAILED",
      field: "vendor_ids",
    });
  });

  it("returns 404 when a selected vendor does not exist", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getVendorById).mockResolvedValueOnce({
      id: 1,
      name: "Acme Trading",
      registration_number: "REG-001",
      contact_info: "contact@example.com",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(getVendorById).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify(validBody),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(insertReport).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Vendor not found",
      code: "VENDOR_NOT_FOUND",
      field: "vendor_ids",
    });
  });

  it("creates a Draft report and returns 201 when input is valid and vendors exist", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getVendorById).mockResolvedValue({
      id: 1,
      name: "Acme Trading",
      registration_number: "REG-001",
      contact_info: "contact@example.com",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(insertReport).mockResolvedValue({
      id: 7,
      reference_number: "VPR-20260101-123456",
      period_type: "Quarterly",
      period_start: "2026-01-01",
      period_end: "2026-03-31",
      status: "Draft",
      vendor_ids: [1, 2],
    });

    const request = new Request("http://localhost/api/reports", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
      body: JSON.stringify(validBody),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(insertReport).toHaveBeenCalledWith({
      period_type: "Quarterly",
      period_start: "2026-01-01",
      period_end: "2026-03-31",
      vendor_ids: [1, 2],
    });
    expect(response.status).toBe(201);
    expect(body).toEqual({
      data: {
        id: 7,
        reference_number: "VPR-20260101-123456",
        period_type: "Quarterly",
        period_start: "2026-01-01",
        period_end: "2026-03-31",
        status: "Draft",
        vendor_ids: [1, 2],
      },
    });
  });
});

describe("GET /api/reports", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when the request is not authenticated", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({
          valid: false,
          reason: "Invalid or Expired token",
        });
        const request = new Request("http://localhost/api/reports", {
          headers: { Authorization: "Bearer bad.token" },
        });
        const response = await GET(request);
        const body = await response.json();
        expect(response.status).toBe(401);
        expect(body).toEqual({
          error: "Invalid or Expired token",
          code: "UNAUTHORIZED",
        });
      });
      it("returns the first page of 15 reports and the total when no page params are given", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(listReports).mockResolvedValue({
          reports: [
            {
              id: 2,
              reference_number: "VPR-20260401-222222",
              period_type: "Custom",
              period_start: "2026-04-01",
              period_end: "2026-04-30",
              status: "Draft",
              created_at: "2026-05-01T00:00:00.000Z",
            },
          ],
          total: 1,
        });
        const request = new Request("http://localhost/api/reports", {
          headers: { Authorization: "Bearer good.token" },
        });
        const response = await GET(request);
        const body = await response.json();
        expect(listReports).toHaveBeenCalledWith({
          limit: 15,
          offset: 0,
          status: undefined,
          search: undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        expect(response.status).toBe(200);
        expect(body).toEqual({
          reports: [
            {
              id: 2,
              reference_number: "VPR-20260401-222222",
              period_type: "Custom",
              period_start: "2026-04-01",
              period_end: "2026-04-30",
              status: "Draft",
              created_at: "2026-05-01T00:00:00.000Z",
            },
          ],
          total: 1,
        });
      });

      it("returns an empty page with the total when the requested page is past the last page", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(listReports).mockResolvedValue({ reports: [], total: 31 });
        const response = await GET(
          new Request("http://localhost/api/reports?page=4&pageSize=15", {
            headers: { Authorization: "Bearer good.token" },
          })
        );
        const body = await response.json();
        expect(listReports).toHaveBeenCalledWith({
          limit: 15,
          offset: 45,
          status: undefined,
          search: undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        expect(response.status).toBe(200);
        expect(body).toEqual({ reports: [], total: 31 });
      });

      it("passes status, search, and sort into the repository query", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(listReports).mockResolvedValue({ reports: [], total: 0 });
        await GET(
          new Request(
            "http://localhost/api/reports?status=Draft&search=VPR-2026&sortBy=periodStart&sortOrder=asc&page=2",
            { headers: { Authorization: "Bearer good.token" } }
          )
        );
        expect(listReports).toHaveBeenCalledWith({
          limit: 15,
          offset: 15,
          status: "Draft",
          search: "VPR-2026",
          sortBy: "periodStart",
          sortOrder: "asc",
        });
      });

      it("returns 400 when status is not Draft or Finalized", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        const response = await GET(
          new Request("http://localhost/api/reports?status=Archived", {
            headers: { Authorization: "Bearer good.token" },
          })
        );
        const body = await response.json();
        expect(listReports).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(body).toEqual({
          error: "status must be Draft or Finalized",
          code: "VALIDATION_FAILED",
          field: "status",
        });
      });

      it("returns 400 when pageSize is not a positive integer", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        const response = await GET(
          new Request("http://localhost/api/reports?pageSize=0", {
            headers: { Authorization: "Bearer good.token" },
          })
        );
        const body = await response.json();
        expect(listReports).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(body).toEqual({
          error: "pageSize must be a positive integer up to 200",
          code: "VALIDATION_FAILED",
          field: "pageSize",
        });
      });
});