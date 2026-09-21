import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE, GET } from "./route";
import { validateAuthHeader } from "../../../../lib/auth";
import { deleteVendor, getVendorById } from "../../../../lib/repositories/vendors";

vi.mock("../../../../lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("../../../../lib/repositories/vendors", () => ({
  deleteVendor: vi.fn(),
  getVendorById: vi.fn(),
}));

describe("DELETE /api/vendors/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/vendors/1", {
      method: "DELETE",
      headers: { Authorization: "Bearer bad.token" },
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Invalid or Expired token",
      code: "UNAUTHORIZED",
    });
  });

  it("returns 409 when the vendor is referenced by a transaction", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(deleteVendor).mockRejectedValue({ number: 547 });

    const request = new Request("http://localhost/api/vendors/1", {
      method: "DELETE",
      headers: { Authorization: "Bearer good.token" },
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "Vendor cannot be deleted as it is referenced by an exisiting transaction",
      code: "VENDOR_REFERENCED",
      field: "id",
    });
  });

  it("returns 400 when the vendor id is not a positive integer", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const request = new Request("http://localhost/api/vendors/abc", {
        method: "DELETE",
        headers: { Authorization: "Bearer good.token"},
    });

    const response = await DELETE(request, {
        params: Promise.resolve({ id: "abc"}),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
        error: "Vendor id must be a positive integer",
        code: "VALIDATION_FAILED",
        field: "id",
    });
  });

  it("returns 404 when the vendor does not exist", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(deleteVendor).mockResolvedValue(0);
  
    const request = new Request("http://localhost/api/vendors/99", {
      method: "DELETE",
      headers: { Authorization: "Bearer good.token" },
    });
  
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "99" }),
    });
    const body = await response.json();
  
    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Vendor not found",
      code: "VENDOR_NOT_FOUND",
      field: "id",
    });
  });
  
  it("returns 500 with a generic message when deleteVendor fails unexpectedly", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(deleteVendor).mockRejectedValue(
      new Error("Login failed for user 'app'")
    );
  
    const request = new Request("http://localhost/api/vendors/1", {
      method: "DELETE",
      headers: { Authorization: "Bearer good.token" },
    });
  
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await response.json();
  
    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Failed to delete vendor",
      code: "INTERNAL_ERROR",
    });
  });

  it("returns 200 when the vendor is deleted", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(deleteVendor).mockResolvedValue(1);
  
    const request = new Request("http://localhost/api/vendors/5", {
      method: "DELETE",
      headers: { Authorization: "Bearer good.token" },
    });
  
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "5" }),
    });
    const body = await response.json();
  
    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

});

describe("GET /api/vendors/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/vendors/1");

    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      error: "Invalid or Expired token",
      code: "UNAUTHORIZED",
    });
  });

  it("returns 400 when the vendor id is not a positive integer", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const request = new Request("http://localhost/api/vendors/abc");

    const response = await GET(request, {
      params: Promise.resolve({ id: "abc" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Vendor id must be a positive integer",
      code: "VALIDATION_FAILED",
      field: "id",
    });
  });

  it("returns 404 when the vendor does not exist", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getVendorById).mockResolvedValue(null);

    const request = new Request("http://localhost/api/vendors/99");

    const response = await GET(request, {
      params: Promise.resolve({ id: "99" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Vendor not found",
      code: "VENDOR_NOT_FOUND",
      field: "id",
    });
  });

  it("returns 500 with a generic message when getVendorById fails unexpectedly", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getVendorById).mockRejectedValue(new Error("Connection lost"));

    const request = new Request("http://localhost/api/vendors/1");

    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      error: "Failed to fetch vendor",
      code: "INTERNAL_ERROR",
    });
  });

  it("returns 200 with the vendor when found", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getVendorById).mockResolvedValue({
      id: 5,
      name: "Acme Trading",
      registration_number: "REG-001",
      contact_info: "contact@example.com",
      created_at: "2026-09-09T10:23:41.000Z",
    });

    const request = new Request("http://localhost/api/vendors/5");

    const response = await GET(request, {
      params: Promise.resolve({ id: "5" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        id: 5,
        name: "Acme Trading",
        registration_number: "REG-001",
        contact_info: "contact@example.com",
        created_at: "2026-09-09T10:23:41.000Z",
      },
    });
  });
});
