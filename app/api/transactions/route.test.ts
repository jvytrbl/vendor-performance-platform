import { vi, expect, it, describe, beforeEach } from "vitest";
import { GET, POST} from "./route";
import { validateAuthHeader } from "../../../lib/auth";
import { insertTransaction, getTransactions } from "@/lib/repositories/transactions";
import { getVendorById } from "@/lib/repositories/vendors";

vi.mock("../../../lib/auth", () => ({
    validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/transactions", () => ({
    getTransactions: vi.fn(),
    insertTransaction: vi.fn(),
}));

vi.mock("@/lib/repositories/vendors", () => ({
   getVendorById: vi.fn(),
}));


const validBody = {
    vendor_id: 1,
    transaction_date: "2026-09-14",
    item_description: "Steel beams",
    agreed_price: 100,
    agreed_delivery_date: "2026-09-20",
    quantity_ordered: 10,
};

describe("POST api/transactions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when a request is not authenticated", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({
            valid: false, 
            reason: "Invalid or Expired token", 
        });

        const request = new Request("http://localhost/api/transactions", {
            method: "POST",
            headers: {Authorization: "Bearer bad.token"},
            body: JSON.stringify(validBody),
        });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body).toEqual({ error: "Invalid or Expired token", code: "UNAUTHORIZED"});
    });

    it("returns 400 with the validation error when the transaction input is invalid", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        const request = new Request("http://localhost/api/transactions", {
          method: "POST",
          headers: { Authorization: "Bearer good.token" },
          body: JSON.stringify({ ...validBody, item_description: "" }),
        });
        const response = await POST(request);
        const body = await response.json();
        expect(response.status).toBe(400);
        expect(body).toEqual({
          error: "Item description is required",
          code: "VALIDATION_FAILED",
          field: "item_description",
        });
      });
      it("returns 404 when the vendor_id does not reference an existing vendor", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(getVendorById).mockResolvedValue(null);
        const request = new Request("http://localhost/api/transactions", {
          method: "POST",
          headers: { Authorization: "Bearer good.token" },
          body: JSON.stringify(validBody),
        });
        const response = await POST(request);
        const body = await response.json();
        expect(getVendorById).toHaveBeenCalledWith(1);
        expect(response.status).toBe(404);
        expect(body).toEqual({
          error: "Vendor not found",
          code: "VENDOR_NOT_FOUND",
          field: "vendor_id",
        });
      });
      it("creates the transaction and returns 201 when the vendor exists and input is valid", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(getVendorById).mockResolvedValue({
          id: 1,
          name: "Acme Trading",
          registration_number: "REG-001",
          contact_info: "contact@example.com",
          created_at: "2026-01-01T00:00:00.000Z",
        });
        vi.mocked(insertTransaction).mockResolvedValue({
          id: 5,
          vendor_id: 1,
          item_description: "Steel beams",
        });
        const request = new Request("http://localhost/api/transactions", {
          method: "POST",
          headers: { Authorization: "Bearer good.token" },
          body: JSON.stringify(validBody),
        });
        const response = await POST(request);
        const body = await response.json();
        expect(response.status).toBe(201);
        expect(body).toEqual({
          data: { id: 5, vendor_id: 1, item_description: "Steel beams" },
        });
      });
});

describe("GET api/transactions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when a request is not authenticated", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({
          valid: false,
          reason: "Invalid or Expired token",
        });
        const request = new Request("http://localhost/api/transactions", {
          headers: { Authorization: "Bearer bad.token" },
        });
        const response = await GET(request);
        const body = await response.json();
        expect(response.status).toBe(401);
        expect(body).toEqual({ error: "Invalid or Expired token", code: "UNAUTHORIZED" });
      });
      it("returns all transactions with default filters when no query params are given", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(getTransactions).mockResolvedValue([{ id: 1 }] as any);
        const request = new Request("http://localhost/api/transactions", {
          headers: { Authorization: "Bearer good.token" },
        });
        const response = await GET(request);
        const body = await response.json();
        expect(getTransactions).toHaveBeenCalledWith({
          vendor_id: undefined,
          dateFrom: undefined,
          dateTo: undefined,
          limit: undefined,
          offset: undefined,
        });
        expect(response.status).toBe(200);
        expect(body).toEqual({ transactions: [{ id: 1 }] });
      });
      it("parses vendor_id, date range, and pagination from query params", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(getTransactions).mockResolvedValue([] as any);
        const request = new Request(
          "http://localhost/api/transactions?vendor_id=5&dateFrom=2026-01-01&dateTo=2026-12-31&limit=20&offset=10",
          { headers: { Authorization: "Bearer good.token" } }
        );
        await GET(request);
        expect(getTransactions).toHaveBeenCalledWith({
          vendor_id: 5,
          dateFrom: "2026-01-01",
          dateTo: "2026-12-31",
          limit: 20,
          offset: 10,
        });
      });
      it("returns 400 when vendor_id is not a positive integer", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        const request = new Request("http://localhost/api/transactions?vendor_id=abc", {
          headers: { Authorization: "Bearer good.token" },
        });
        const response = await GET(request);
        const body = await response.json();
        expect(getTransactions).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(body).toEqual({
          error: "vendor_id must be a positive integer",
          code: "VALIDATION_FAILED",
          field: "vendor_id",
        });
      });
      it("returns 400 when limit is not a non-negative integer", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        const request = new Request("http://localhost/api/transactions?limit=-5", {
          headers: { Authorization: "Bearer good.token" },
        });
        const response = await GET(request);
        const body = await response.json();
        expect(response.status).toBe(400);
        expect(body).toEqual({
          error: "limit must be a non-negative integer",
          code: "VALIDATION_FAILED",
          field: "limit",
        });
      });
});