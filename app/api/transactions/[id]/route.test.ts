import { describe, vi, it, expect, beforeEach } from "vitest";
import { GET, PUT, DELETE} from "./route";
import { validateAuthHeader } from "../../../../lib/auth";
import { getVendorById } from "@/lib/repositories/vendors";
import { getTransactionById, getFinalizedReports, updateTransaction, deleteTransaction } from "@/lib/repositories/transactions";


vi.mock("../../../../lib/auth", () => ({
    validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/repositories/vendors", () => ({
    getVendorById: vi.fn(),
}));

vi.mock("@/lib/repositories/transactions", () => ({
    getTransactionById: vi.fn(),
    getFinalizedReports: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
}));

const validBody = {
  vendor_id: 1,
  transaction_date: "2026-09-14",
  item_description: "Updated beams",
  agreed_price: 150,
  agreed_delivery_date: "2026-09-20",
  quantity_ordered: 12,
};

const existingTransaction = {
    id: 5,
  vendor_id: 1,
  transaction_date: "2026-06-15",
  item_description: "Steel beams",
  agreed_price: 100,
  agreed_delivery_date: "2026-06-20",
  quantity_ordered: 10,
};

describe("GET /api/transactions/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const request = new Request("http://localhost/api/transactions/5");
    const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Invalid or Expired token", code: "UNAUTHORIZED" });
  });

  it("returns 400 when the id is not a positive integer", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const request = new Request("http://localhost/api/transactions/abc");
    const response = await GET(request, { params: Promise.resolve({ id: "abc" }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Transaction id must be a positive integer",
      code: "VALIDATION_FAILED",
      field: "id",
    });
  });

  it("returns 404 when the transaction does not exist", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getTransactionById).mockResolvedValue(null);

    const request = new Request("http://localhost/api/transactions/999");
    const response = await GET(request, { params: Promise.resolve({ id: "999" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Transaction not found",
      code: "TRANSACTION_NOT_FOUND",
      field: "id",
    });
  });

  it("returns 200 with the transaction when found", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(getTransactionById).mockResolvedValue(existingTransaction as any);

    const request = new Request("http://localhost/api/transactions/5");
    const response = await GET(request, { params: Promise.resolve({ id: "5" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: existingTransaction });
  });
});

describe("PUT /api/transactions/:id", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when the request is not authenticated", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({
          valid: false,
          reason: "Invalid or Expired token",
        });
        const request = new Request("http://localhost/api/transactions/5", {
          method: "PUT",
          headers: { Authorization: "Bearer bad.token" },
          body: JSON.stringify(validBody),
        });
        const response = await PUT(request, { params: Promise.resolve({ id: "5" }) });
        const body = await response.json();
        expect(response.status).toBe(401);
        expect(body).toEqual({ error: "Invalid or Expired token", code: "UNAUTHORIZED" });
      });
      it("returns 400 when the id is not a positive integer", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        const request = new Request("http://localhost/api/transactions/abc", {
          method: "PUT",
          headers: { Authorization: "Bearer good.token" },
          body: JSON.stringify(validBody),
        });
        const response = await PUT(request, { params: Promise.resolve({ id: "abc" }) });
        const body = await response.json();
        expect(response.status).toBe(400);
        expect(body).toEqual({
          error: "Transaction id must be a positive integer",
          code: "VALIDATION_FAILED",
          field: "id",
        });
      });
      it("returns 400 with the validation error when the input is invalid", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        const request = new Request("http://localhost/api/transactions/5", {
          method: "PUT",
          headers: { Authorization: "Bearer good.token" },
          body: JSON.stringify({ ...validBody, item_description: "" }),
        });
        const response = await PUT(request, { params: Promise.resolve({ id: "5" }) });
        const body = await response.json();
        expect(response.status).toBe(400);
        expect(body).toEqual({
          error: "Item description is required",
          code: "VALIDATION_FAILED",
          field: "item_description",
        });
      });
      it("returns 404 when the transaction does not exist", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(getTransactionById).mockResolvedValue(null);
        const request = new Request("http://localhost/api/transactions/999", {
          method: "PUT",
          headers: { Authorization: "Bearer good.token" },
          body: JSON.stringify(validBody),
        });
        const response = await PUT(request, { params: Promise.resolve({ id: "999" }) });
        const body = await response.json();
        expect(response.status).toBe(404);
        expect(body).toEqual({
          error: "Transaction not found",
          code: "TRANSACTION_NOT_FOUND",
          field: "id",
        });
      });
      it("returns 409 when the transaction's CURRENT date/vendor is locked by a finalized report, even if the request tries to change the date", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(getTransactionById).mockResolvedValue(existingTransaction as any);
        vi.mocked(getFinalizedReports).mockResolvedValue([
          { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: [1] },
        ]);
        const request = new Request("http://localhost/api/transactions/5", {
          method: "PUT",
          headers: { Authorization: "Bearer good.token" },
          body: JSON.stringify(validBody), // note: validBody's date (2026-09-14) is NOT in the locked range
        });
        const response = await PUT(request, { params: Promise.resolve({ id: "5" }) });
        const body = await response.json();
        expect(response.status).toBe(409);
        expect(body).toEqual({
          error: "Transaction cannot be edited because it is part of finalized report RPT-2026-Q2-001",
          code: "TRANSACTION_LOCKED",
          field: "id",
        });
      });

      it("returns 404 when the new vendor_id does not reference an existing vendor", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(getTransactionById).mockResolvedValue(existingTransaction as any);
        vi.mocked(getFinalizedReports).mockResolvedValue([]);
        vi.mocked(getVendorById).mockResolvedValue(null);
        const request = new Request("http://localhost/api/transactions/5", {
          method: "PUT",
          headers: { Authorization: "Bearer good.token" },
          body: JSON.stringify(validBody),
        });
        const response = await PUT(request, { params: Promise.resolve({ id: "5" }) });
        const body = await response.json();
        expect(response.status).toBe(404);
        expect(body).toEqual({
          error: "Vendor not found",
          code: "VENDOR_NOT_FOUND",
          field: "vendor_id",
        });
      });
      it("updates the transaction and returns 200 when everything checks out", async () => {
        vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
        vi.mocked(getTransactionById).mockResolvedValue(existingTransaction as any);
        vi.mocked(getFinalizedReports).mockResolvedValue([]);
        vi.mocked(getVendorById).mockResolvedValue({ id: 1, name: "Acme Trading" } as any);
        vi.mocked(updateTransaction).mockResolvedValue({
          id: 5,
          vendor_id: 1,
          item_description: "Updated beams",
        } as any);
        const request = new Request("http://localhost/api/transactions/5", {
          method: "PUT",
          headers: { Authorization: "Bearer good.token" },
          body: JSON.stringify(validBody),
        });
        const response = await PUT(request, { params: Promise.resolve({ id: "5" }) });
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body).toEqual({
          data: { id: 5, vendor_id: 1, item_description: "Updated beams" },
        });
      });
});

describe("DELETE /api/transactions/:id", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
    it("returns 401 when the request is not authenticated", async () => {
      vi.mocked(validateAuthHeader).mockResolvedValue({
        valid: false,
        reason: "Invalid or Expired token",
      });
      const request = new Request("http://localhost/api/transactions/5", {
        method: "DELETE",
        headers: { Authorization: "Bearer bad.token" },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "5" }) });
      const body = await response.json();
      expect(response.status).toBe(401);
      expect(body).toEqual({ error: "Invalid or Expired token", code: "UNAUTHORIZED" });
    });
    it("returns 400 when the id is not a positive integer", async () => {
      vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
      const request = new Request("http://localhost/api/transactions/abc", {
        method: "DELETE",
        headers: { Authorization: "Bearer good.token" },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "abc" }) });
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body).toEqual({
        error: "Transaction id must be a positive integer",
        code: "VALIDATION_FAILED",
        field: "id",
      });
    });
    it("returns 404 when the transaction does not exist", async () => {
      vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
      vi.mocked(getTransactionById).mockResolvedValue(null);
      const request = new Request("http://localhost/api/transactions/999", {
        method: "DELETE",
        headers: { Authorization: "Bearer good.token" },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "999" }) });
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body).toEqual({
        error: "Transaction not found",
        code: "TRANSACTION_NOT_FOUND",
        field: "id",
      });
    });
    it("returns 409 when the transaction is locked by a finalized report", async () => {
  vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
  vi.mocked(getTransactionById).mockResolvedValue(existingTransaction as any);
  vi.mocked(getFinalizedReports).mockResolvedValue([
    { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: [1] },
  ]);
  const request = new Request("http://localhost/api/transactions/5", {
    method: "DELETE",
    headers: { Authorization: "Bearer good.token" },
  });
  const response = await DELETE(request, { params: Promise.resolve({ id: "5" }) });
  const body = await response.json();
  expect(response.status).toBe(409);
  expect(body).toEqual({
    error: "Transaction cannot be deleted because it is part of finalized report RPT-2026-Q2-001",
    code: "TRANSACTION_LOCKED",
    field: "id",
  });
});
    it("deletes the transaction and returns 200 when it is not locked", async () => {
      vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
      vi.mocked(getTransactionById).mockResolvedValue(existingTransaction as any);
      vi.mocked(getFinalizedReports).mockResolvedValue([]);
      vi.mocked(deleteTransaction).mockResolvedValue(1);
      const request = new Request("http://localhost/api/transactions/5", {
        method: "DELETE",
        headers: { Authorization: "Bearer good.token" },
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "5" }) });
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body).toEqual({ ok: true });
    });
  });