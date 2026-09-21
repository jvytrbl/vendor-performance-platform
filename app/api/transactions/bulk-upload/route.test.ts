import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { validateAuthHeader } from "../../../../lib/auth";
import { parseTransactionFile } from "@/lib/uploads/parseTransactionFile";
import { getAllVendors } from "@/lib/repositories/vendors";
import { insertTransaction } from "@/lib/repositories/transactions";

vi.mock("../../../../lib/auth", () => ({
  validateAuthHeader: vi.fn(),
}));

vi.mock("@/lib/uploads/parseTransactionFile", () => ({
  parseTransactionFile: vi.fn(),
}));

vi.mock("@/lib/repositories/vendors", () => ({
  getAllVendors: vi.fn(),
}));

vi.mock("@/lib/repositories/transactions", () => ({
  insertTransaction: vi.fn(),
}));

const validRow = {
  vendor_name: "Acme Trading",
  transaction_date: "2026-09-14",
  item_description: "Steel beams",
  agreed_price: 100,
  agreed_delivery_date: "2026-09-20",
  quantity_ordered: 10,
};

function buildRequest(withFile = true) {
  const formData = new FormData();
  if (withFile) {
    formData.append("file", new File(["irrelevant"], "upload.csv", { type: "text/csv" }));
  }
  return new Request("http://localhost/api/transactions/bulk-upload", {
    method: "POST",
    headers: { Authorization: "Bearer good.token" },
    body: formData,
  });
}

describe("POST /api/transactions/bulk-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request is not authenticated", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({
      valid: false,
      reason: "Invalid or Expired token",
    });

    const response = await POST(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Invalid or Expired token", code: "UNAUTHORIZED" });
  });

  it("returns 400 when no file is uploaded", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const response = await POST(buildRequest(false));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "No file uploaded",
      code: "VALIDATION_FAILED",
      field: "file",
    });
  });

  it("rejects the whole file when it exceeds the maximum file size, before parsing it", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });

    const oversizedContent = "x".repeat(10 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append("file", new File([oversizedContent], "big.csv", { type: "text/csv" }));
    const request = new Request("http://localhost/api/transactions/bulk-upload", {
      method: "POST",
      headers: { Authorization: "Bearer good.token" },
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "File exceeds the maximum size of 10MB",
      code: "FILE_TOO_LARGE",
      field: "file",
    });
    expect(parseTransactionFile).not.toHaveBeenCalled();
  });

  it("rejects the whole file when required columns are missing", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(parseTransactionFile).mockResolvedValue({
      headers: ["vendor_name", "item_description"],
      rows: [],
    });

    const response = await POST(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("MISSING_COLUMNS");
    expect(insertTransaction).not.toHaveBeenCalled();
  });

  it("rejects the whole file when it exceeds the maximum row count", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(parseTransactionFile).mockResolvedValue({
      headers: Object.keys(validRow),
      rows: new Array(50001).fill(validRow),
    });

    const response = await POST(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "File exceeds the maximum of 50000 rows",
      code: "TOO_MANY_ROWS",
      field: "file",
    });
  });

  it("inserts valid rows, skips format-invalid and vendor-not-found rows individually, and reports both", async () => {
    vi.mocked(validateAuthHeader).mockResolvedValue({ valid: true });
    vi.mocked(parseTransactionFile).mockResolvedValue({
      headers: Object.keys(validRow),
      rows: [
        validRow,
        { ...validRow, item_description: "" },
        { ...validRow, vendor_name: "Nonexistent Vendor" },
      ],
    });
    vi.mocked(getAllVendors).mockResolvedValue([{ id: 1, name: "Acme Trading" }]);
    vi.mocked(insertTransaction).mockResolvedValue({ id: 10, vendor_id: 1, item_description: "Steel beams" });

    const response = await POST(buildRequest());
    const body = await response.json();

    expect(insertTransaction).toHaveBeenCalledTimes(1);
    expect(insertTransaction).toHaveBeenCalledWith({ ...validRow, vendor_id: 1 });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: { inserted: 1, failed: 2 },
      errors: [
        { row: 3, error: "Item description is required", code: "VALIDATION_FAILED", field: "item_description" },
        {
          row: 4,
          error: 'No vendor found matching "Nonexistent Vendor"',
          code: "VENDOR_NOT_FOUND",
          field: "vendor_name",
        },
      ],
    });
  });
});
