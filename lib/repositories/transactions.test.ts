import { describe, it, expect, vi, beforeEach } from "vitest";
import { insertTransaction, getTransactions } from "./transactions";
import { getDbPool } from "@/lib/db";
import { getFinalizedReports, updateTransaction, deleteTransaction, getTransactionById, getTransactionsForPeriod } from "./transactions"; 


vi.mock("@/lib/db", () => ({
  getDbPool: vi.fn(),
}));

function mockRequest() {
  const request: any = {};
  request.input = vi.fn().mockReturnValue(request);
  request.query = vi.fn();
  return request;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("insertTransaction", () => {
  it("inserts a transaction using parameterized bindings and returns the created record", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({
      recordset: [{ id: 1, vendor_id: 1, item_description: "Steel beams" }],
    });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    const result = await insertTransaction({
      vendor_id: 1,
      transaction_date: "2026-09-14",
      item_description: "Steel beams",
      agreed_price: 100,
      agreed_delivery_date: "2026-09-20",
      quantity_ordered: 10,
    });

    expect(request.input).toHaveBeenCalledWith("vendor_id", 1);
    expect(request.input).toHaveBeenCalledWith("transaction_date", "2026-09-14");
    expect(request.input).toHaveBeenCalledWith("item_description", "Steel beams");
    expect(request.input).toHaveBeenCalledWith("agreed_price", 100);
    expect(request.input).toHaveBeenCalledWith("agreed_delivery_date", "2026-09-20");
    expect(request.input).toHaveBeenCalledWith("quantity_ordered", 10);
    expect(result).toEqual({ id: 1, vendor_id: 1, item_description: "Steel beams" });
  });
});

describe("getTransactions — category 2: filter combinations", () => {
  it("returns all transactions with default pagination when no filters are given", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ recordset: [{ id: 1 }] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    const result = await getTransactions({});

    const sql = request.query.mock.calls[0][0];
    expect(sql).not.toContain("WHERE");
    expect(request.input).toHaveBeenCalledWith("offset", 0);
    expect(request.input).toHaveBeenCalledWith("limit", 50);
    expect(result).toEqual([{ id: 1 }]);
  });

  it("filters by vendor_id only", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    await getTransactions({ vendor_id: 5 });

    const sql = request.query.mock.calls[0][0];
    expect(sql).toContain("vendor_id = @vendor_id");
    expect(sql).not.toContain("transaction_date >=");
    expect(request.input).toHaveBeenCalledWith("vendor_id", 5);
  });

  it("filters by date range only", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    await getTransactions({ dateFrom: "2026-01-01", dateTo: "2026-12-31" });

    const sql = request.query.mock.calls[0][0];
    expect(sql).toContain("transaction_date >= @dateFrom");
    expect(sql).toContain("transaction_date <= @dateTo");
    expect(sql).not.toContain("vendor_id =");
    expect(request.input).toHaveBeenCalledWith("dateFrom", "2026-01-01");
    expect(request.input).toHaveBeenCalledWith("dateTo", "2026-12-31");
  });

  it("filters by vendor_id and date range together", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    await getTransactions({
      vendor_id: 5,
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
    });

    const sql = request.query.mock.calls[0][0];
    expect(sql).toContain("vendor_id = @vendor_id");
    expect(sql).toContain("transaction_date >= @dateFrom");
    expect(sql).toContain("transaction_date <= @dateTo");
  });
});

describe("getTransactions — category 6: pagination", () => {
  it("passes through a custom limit and offset", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    await getTransactions({ limit: 20, offset: 40 });

    expect(request.input).toHaveBeenCalledWith("limit", 20);
    expect(request.input).toHaveBeenCalledWith("offset", 40);
  });

  it("caps an oversized limit at 200", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    await getTransactions({ limit: 5000 });

    expect(request.input).toHaveBeenCalledWith("limit", 200);
  });
});

describe("getTransactionsForPeriod", () => {
  it("loads all transactions for the vendors and period with no page cap", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ recordset: [{ id: 1, vendor_id: 1 }] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);

    const result = await getTransactionsForPeriod([1, 2], "2026-01-01", "2026-03-31");

    expect(request.input).toHaveBeenCalledWith("vendor0", 1);
    expect(request.input).toHaveBeenCalledWith("vendor1", 2);
    expect(request.input).toHaveBeenCalledWith("dateFrom", "2026-01-01");
    expect(request.input).toHaveBeenCalledWith("dateTo", "2026-03-31");
    expect(request.query.mock.calls[0][0]).not.toContain("FETCH NEXT");
    expect(result).toEqual([{ id: 1, vendor_id: 1 }]);
  });
});

describe("getFinalizedReports", () => {
  it("returns finalized reports with vendor_ids parsed into a number array", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({
      recordset: [
        { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: "1,2,3" },
      ],
    });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);
    const result = await getFinalizedReports();
    expect(result).toEqual([
      { id: 1, reference_number: "RPT-2026-Q2-001", period_start: "2026-06-01", period_end: "2026-06-30", vendor_ids: [1, 2, 3] },
    ]);
  });
  it("returns an empty array when there are no finalized reports", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);
    const result = await getFinalizedReports();
    expect(result).toEqual([]);
  });
});

describe("updateTransaction", () => {
  it("updates a transaction using parameterized bindings and returns the updated record", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({
      recordset: [{ id: 5, vendor_id: 1, item_description: "Updated beams" }],
    });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);
    const result = await updateTransaction(5, {
      vendor_id: 1,
      transaction_date: "2026-09-14",
      item_description: "Updated beams",
      agreed_price: 150,
      agreed_delivery_date: "2026-09-20",
      quantity_ordered: 10,
    });
    expect(request.input).toHaveBeenCalledWith("id", 5);
    expect(request.input).toHaveBeenCalledWith("vendor_id", 1);
    expect(request.input).toHaveBeenCalledWith("item_description", "Updated beams");
    expect(result).toEqual({ id: 5, vendor_id: 1, item_description: "Updated beams" });
  });
  it("returns null when no transaction matches the id", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ recordset: [] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);
    const result = await updateTransaction(999, {
      vendor_id: 1,
      transaction_date: "2026-09-14",
      item_description: "Steel beams",
      agreed_price: 100,
      agreed_delivery_date: "2026-09-20",
      quantity_ordered: 10,
    });
    expect(result).toBeNull();
  });
  it("passes actual_price, actual_delivery_date, and quantity_received through as null when omitted", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({
      recordset: [{ id: 5, vendor_id: 1, item_description: "Updated beams" }],
    });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);
    await updateTransaction(5, {
      vendor_id: 1,
      transaction_date: "2026-09-14",
      item_description: "Updated beams",
      agreed_price: 150,
      agreed_delivery_date: "2026-09-20",
      quantity_ordered: 10,
    });
    expect(request.input).toHaveBeenCalledWith("actual_price", null);
    expect(request.input).toHaveBeenCalledWith("actual_delivery_date", null);
    expect(request.input).toHaveBeenCalledWith("quantity_received", null);
  });
  it("passes actual_price, actual_delivery_date, and quantity_received through when provided", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({
      recordset: [{ id: 5, vendor_id: 1, item_description: "Updated beams" }],
    });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);
    await updateTransaction(5, {
      vendor_id: 1,
      transaction_date: "2026-09-14",
      item_description: "Updated beams",
      agreed_price: 150,
      actual_price: 145,
      agreed_delivery_date: "2026-09-20",
      actual_delivery_date: "2026-09-19",
      quantity_ordered: 10,
      quantity_received: 10,
    });
    expect(request.input).toHaveBeenCalledWith("actual_price", 145);
    expect(request.input).toHaveBeenCalledWith("actual_delivery_date", "2026-09-19");
    expect(request.input).toHaveBeenCalledWith("quantity_received", 10);
  });
});
describe("deleteTransaction", () => {
  it("deletes a transaction using a parameterized id binding and returns the affected row count", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({ rowsAffected: [1] });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request } as any);
    const result = await deleteTransaction(5);
    expect(request.input).toHaveBeenCalledWith("id", 5);
    expect(request.query).toHaveBeenCalledWith("DELETE FROM VENDOR_TRANSACTIONS WHERE id = @id");
    expect(result).toBe(1);
  });
});

describe("getTransactionbyId", () => {
  it("returns the transaction when found", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue({
      recordset: [{  id:5, vendor_id: 1, item_description: "Steel beams"}],
    });
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request} as any);

    const result = await getTransactionById(5);

    expect(request.input).toHaveBeenCalledWith("id", 5);
    expect(result).toEqual({ id: 5, vendor_id: 1, item_description: "Steel beams"});
  });

  it("returns null whenn no transaction matches the id", async () => {
    const request = mockRequest();
    request.query.mockResolvedValue( { recordset: []});
    vi.mocked(getDbPool).mockResolvedValue({ request: () => request} as any);

    const result = await getTransactionById(999);

    expect(result).toBeNull();
  })
})