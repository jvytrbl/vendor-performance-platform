import { getDbPool } from "@/lib/db";
import type { TransactionInput } from "@/lib/domain/transactions/validateTransactionInput";

export interface TransactionRecord {
  id: number;
  vendor_id: number;
  transaction_date?: string;
  item_description?: string;
  agreed_price?: number;
  actual_price?: number;
  agreed_delivery_date?: string;
  actual_delivery_date?: string;
  quantity_ordered?: number;
  quantity_received?: number;
  created_at?: string;
}

export interface TransactionFilters {
  vendor_id?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface FinalizedReportLock {
  id: number;
  reference_number: string;
  period_start: string;
  period_end: string;
  vendor_ids: number[];
}

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export async function insertTransaction(
  input: TransactionInput
): Promise<TransactionRecord> {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("vendor_id", input.vendor_id)
    .input("transaction_date", input.transaction_date)
    .input("item_description", input.item_description)
    .input("agreed_price", input.agreed_price)
    .input("agreed_delivery_date", input.agreed_delivery_date)
    .input("quantity_ordered", input.quantity_ordered)
    .query(
      `INSERT INTO VENDOR_TRANSACTIONS
        (vendor_id, transaction_date, item_description, agreed_price, agreed_delivery_date, quantity_ordered)
       OUTPUT INSERTED.id, INSERTED.vendor_id, INSERTED.item_description
       VALUES (@vendor_id, @transaction_date, @item_description, @agreed_price, @agreed_delivery_date, @quantity_ordered)`
    );

  return result.recordset[0];
}

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<{ transactions: TransactionRecord[]; total: number }> {
  const { vendor_id, dateFrom, dateTo } = filters;
  const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = filters.offset ?? 0;

  const pool = await getDbPool();
  const request = pool.request();

  const conditions: string[] = [];

  if (vendor_id !== undefined) {
    conditions.push("vendor_id = @vendor_id");
    request.input("vendor_id", vendor_id);
  }

  if (dateFrom !== undefined) {
    conditions.push("transaction_date >= @dateFrom");
    request.input("dateFrom", dateFrom);
  }

  if (dateTo !== undefined) {
    conditions.push("transaction_date <= @dateTo");
    request.input("dateTo", dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  request.input("offset", offset);
  request.input("limit", limit);

  const result = await request.query(
    `SELECT COUNT(*) AS total
     FROM VENDOR_TRANSACTIONS
     ${whereClause}`
  );
  const total = Number(result.recordset[0]?.total ?? 0);

  const page = await request.query(
    `SELECT id, vendor_id, transaction_date, item_description, agreed_price, actual_price,
            agreed_delivery_date, actual_delivery_date, quantity_ordered, quantity_received, created_at
     FROM VENDOR_TRANSACTIONS
     ${whereClause}
     ORDER BY transaction_date DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
  );

  return { transactions: page.recordset, total };
}

export async function getTransactionsForPeriod(
  vendorIds: number[],
  dateFrom: string,
  dateTo: string
): Promise<TransactionRecord[]> {
  if (vendorIds.length === 0) {
    return [];
  }

  const pool = await getDbPool();
  const request = pool.request();
  const vendorParams = vendorIds.map((id, index) => {
    request.input(`vendor${index}`, id);
    return `@vendor${index}`;
  });
  request.input("dateFrom", dateFrom);
  request.input("dateTo", dateTo);

  const result = await request.query(
    `SELECT id, vendor_id, transaction_date, item_description, agreed_price, actual_price,
            agreed_delivery_date, actual_delivery_date, quantity_ordered, quantity_received, created_at
     FROM VENDOR_TRANSACTIONS
     WHERE vendor_id IN (${vendorParams.join(", ")})
       AND transaction_date >= @dateFrom
       AND transaction_date <= @dateTo`
  );

  return result.recordset;
}

export async function getFinalizedReports(): Promise<FinalizedReportLock[]> {
  const pool = await getDbPool();
  const result = await pool.request().query(
    `SELECT r.id, r.reference_number, r.period_start, r.period_end, STRING_AGG(rv.vendor_id, ',') AS vendor_ids
     FROM VENDOR_PERFORMANCE_REPORTS r
     JOIN VENDOR_PERFORMANCE_REPORT_VENDORS rv ON rv.report_id = r.id
     WHERE r.status = 'Finalized'
     GROUP BY r.id, r.reference_number, r.period_start, r.period_end`
  );
  return result.recordset.map((row: any) => ({
    id: row.id,
    reference_number: row.reference_number,
    period_start: row.period_start,
    period_end: row.period_end,
    vendor_ids: row.vendor_ids
      ? row.vendor_ids.split(",").map((id: string) => Number(id))
      : [],
  }));
}

export async function updateTransaction(
  id: number,
  input: TransactionInput
): Promise<TransactionRecord | null> {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("id", id)
    .input("vendor_id", input.vendor_id)
    .input("transaction_date", input.transaction_date)
    .input("item_description", input.item_description)
    .input("agreed_price", input.agreed_price)
    .input("actual_price", input.actual_price ?? null)
    .input("agreed_delivery_date", input.agreed_delivery_date)
    .input("actual_delivery_date", input.actual_delivery_date ?? null)
    .input("quantity_ordered", input.quantity_ordered)
    .input("quantity_received", input.quantity_received ?? null)
    .query(
      `UPDATE VENDOR_TRANSACTIONS
       SET vendor_id = @vendor_id,
           transaction_date = @transaction_date,
           item_description = @item_description,
           agreed_price = @agreed_price,
           actual_price = @actual_price,
           agreed_delivery_date = @agreed_delivery_date,
           actual_delivery_date = @actual_delivery_date,
           quantity_ordered = @quantity_ordered,
           quantity_received = @quantity_received
       OUTPUT INSERTED.id, INSERTED.vendor_id, INSERTED.item_description
       WHERE id = @id`
    );
  return result.recordset[0] ?? null;
}

export async function deleteTransaction(id: number): Promise<number> {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("id", id)
    .query("DELETE FROM VENDOR_TRANSACTIONS WHERE id = @id");
  return result.rowsAffected[0] ?? 0;
}

export async function getTransactionById(id: number):  Promise<TransactionRecord | null> {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("id", id)
    .query(
      `SELECT id, vendor_id, transaction_date, item_description, agreed_price, actual_price,
              agreed_delivery_date, actual_delivery_date, quantity_ordered, quantity_received, created_at
      FROM VENDOR_TRANSACTIONS
      WHERE id = @id`
    );

    return result.recordset[0] ?? null;
}