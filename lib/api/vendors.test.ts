import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchVendors, createVendor, deleteVendor, fetchVendorById } from "./vendors";

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

describe("fetchVendors", () => {
  it("returns the vendor list on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, { vendors: [{ id: 1, name: "Acme Trading" }], total: 1 })
    );

    const result = await fetchVendors("good.token");

    expect(fetch).toHaveBeenCalledWith("/api/vendors", {
      headers: { Authorization: "Bearer good.token" },
    });
    expect(result).toEqual({ vendors: [{ id: 1, name: "Acme Trading" }], total: 1 });
  });

  it("throws with the server's error message when the request fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(401, { error: "Invalid or Expired token" })
    );

    await expect(fetchVendors("bad.token")).rejects.toThrow(
      "Invalid or Expired token"
    );
  });
});

describe("createVendor", () => {
  const input = {
    name: "Acme Trading",
    registration_number: "REG-001",
    contact_info: "contact@example.com",
  };

  it("returns outcome 'created' on 201", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(201, { data: { id: 5, name: "Acme Trading" } })
    );

    const result = await createVendor(input, "good.token");

    expect(result).toEqual({
      outcome: "created",
      vendor: { id: 5, name: "Acme Trading" },
    });
  });

  it("returns outcome 'possibleDuplicate' on 409 with a possibleDuplicate body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, {
        possibleDuplicate: { id: 1, name: "Acme Trading Sdn Bhd" },
      })
    );

    const result = await createVendor(input, "good.token");

    expect(result).toEqual({
      outcome: "possibleDuplicate",
      vendor: { id: 1, name: "Acme Trading Sdn Bhd" },
    });
  });

  it("returns outcome 'error' on 400 validation failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(400, {
        error: "Vendor name is required",
        code: "VALIDATION_FAILED",
        field: "name",
      })
    );

    const result = await createVendor(input, "good.token");

    expect(result).toEqual({
      outcome: "error",
      error: "Vendor name is required",
      code: "VALIDATION_FAILED",
      field: "name",
    });
  });
});

describe("deleteVendor", () => {
  it("returns outcome 'deleted' on 200", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, { ok: true }));

    const result = await deleteVendor(5, "good.token");

    expect(fetch).toHaveBeenCalledWith("/api/vendors/5", {
      method: "DELETE",
      headers: { Authorization: "Bearer good.token" },
    });
    expect(result).toEqual({ outcome: "deleted" });
  });

  it("returns outcome 'error' on 404 not found", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(404, {
        error: "Vendor not found",
        code: "VENDOR_NOT_FOUND",
        field: "id",
      })
    );

    const result = await deleteVendor(99, "good.token");

    expect(result).toEqual({
      outcome: "error",
      error: "Vendor not found",
      code: "VENDOR_NOT_FOUND",
      field: "id",
    });
  });
});

describe("fetchVendorById", () => {
  it("returns outcome 'found' with the vendor on 200", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(200, {
        data: {
          id: 5,
          name: "Acme Trading",
          registration_number: "REG-001",
          contact_info: "contact@example.com",
          created_at: "2026-09-09T10:23:41.000Z",
        },
      })
    );

    const result = await fetchVendorById(5, "good.token");

    expect(fetch).toHaveBeenCalledWith("/api/vendors/5", {
      headers: { Authorization: "Bearer good.token" },
    });
    expect(result).toEqual({
      outcome: "found",
      vendor: {
        id: 5,
        name: "Acme Trading",
        registration_number: "REG-001",
        contact_info: "contact@example.com",
        created_at: "2026-09-09T10:23:41.000Z",
      },
    });
  });

  it("returns outcome 'error' on 404 not found", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(404, {
        error: "Vendor not found",
        code: "VENDOR_NOT_FOUND",
        field: "id",
      })
    );

    const result = await fetchVendorById(99, "good.token");

    expect(result).toEqual({
      outcome: "error",
      error: "Vendor not found",
      code: "VENDOR_NOT_FOUND",
      field: "id",
    });
  });
});