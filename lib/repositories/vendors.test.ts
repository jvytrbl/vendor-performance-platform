import { describe, it, expect, vi } from "vitest";
import { getAllVendors, insertVendor, deleteVendor, getVendorById } from "./vendors";
import { getDbPool } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  getDbPool: vi.fn(),
}));

describe("getAllVendors", () => {
  it("returns vendors from the database as plain records", async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      recordset: [{ id: 1, name: "Acme Trading" }],
    });
    vi.mocked(getDbPool).mockResolvedValue({
      request: () => ({ query: mockQuery }),
    } as any);

    const result = await getAllVendors();

    expect(result).toEqual([{ id: 1, name: "Acme Trading" }]);
  });
});

describe("insertVendor", () => {
    it("insert a vendor using parameterized query bindings and returns the created record", async () => {
        const mockRequest: any = {};
        mockRequest.input = vi.fn().mockReturnValue(mockRequest);
        mockRequest.query = vi.fn().mockResolvedValue({
            recordset: [{ id: 5, name: "Acme Trading"}],
        });

        vi.mocked(getDbPool).mockResolvedValue({
            request: () => mockRequest,
        } as any);

        const result = await insertVendor({
            name: "Acme Trading",
            registration_number: "REG-001",
            contact_info: "contact@example.com",
        });

        expect(mockRequest.input).toHaveBeenCalledWith("name", "Acme Trading");
        expect(mockRequest.input).toHaveBeenCalledWith("registration_number", "REG-001");
        expect(mockRequest.input).toHaveBeenCalledWith("contact_info", "contact@example.com");
        expect(result).toEqual({ id: 5, name: "Acme Trading"});
    });
});

describe("deleteVendor", () => {
  it("deletes a vendor using a parameterized id binding and returns the affected row count", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({
      rowsAffected: [1],
    });

    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    const result = await deleteVendor(5);

    expect(mockRequest.input).toHaveBeenCalledWith("id", 5);
    expect(mockRequest.query).toHaveBeenCalledWith(
      "DELETE FROM VENDORS WHERE id = @id"
    );
    expect(result).toBe(1);
  });
});

describe("getVendorById", () => {
  it("returns the full vendor record when found", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({
      recordset: [
        {
          id: 5,
          name: "Acme Trading",
          registration_number: "REG-001",
          contact_info: "contact@example.com",
          created_at: "2026-09-09T10:23:41.000Z",
        },
      ],
    });

    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    const result = await getVendorById(5);

    expect(mockRequest.input).toHaveBeenCalledWith("id", 5);
    expect(mockRequest.query).toHaveBeenCalledWith(
      "SELECT id, name, registration_number, contact_info, created_at FROM VENDORS WHERE id = @id"
    );
    expect(result).toEqual({
      id: 5,
      name: "Acme Trading",
      registration_number: "REG-001",
      contact_info: "contact@example.com",
      created_at: "2026-09-09T10:23:41.000Z",
    });
  });

  it("returns null when no vendor matches the id", async () => {
    const mockRequest: any = {};
    mockRequest.input = vi.fn().mockReturnValue(mockRequest);
    mockRequest.query = vi.fn().mockResolvedValue({ recordset: [] });

    vi.mocked(getDbPool).mockResolvedValue({
      request: () => mockRequest,
    } as any);

    const result = await getVendorById(99);

    expect(result).toBeNull();
  });
});