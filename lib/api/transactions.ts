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

export interface TransactionInput {
  vendor_id: number;
  transaction_date: string;
  item_description: string;
  agreed_price: number;
  actual_price?: number;
  agreed_delivery_date: string;
  actual_delivery_date?: string;
  quantity_ordered: number;
  quantity_received?: number;
}

export interface TransactionFilters {
  vendor_id?: number;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchTransactions(
  filters: TransactionFilters,
  accessToken: string
): Promise<TransactionRecord[]> {
  const params = new URLSearchParams();
  if (filters.vendor_id !== undefined) {
    params.set("vendor_id", String(filters.vendor_id));
  }
  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }
  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  const query = params.toString();
  const response = await fetch(`/api/transactions${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to fetch transactions");
  }

  return body.transactions;
}

export type CreateTransactionResult =
  | { outcome: "created"; transaction: TransactionRecord }
  | { outcome: "error"; error: string; code: string; field?: string };

export async function createTransaction(
  input: TransactionInput,
  accessToken: string
): Promise<CreateTransactionResult> {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  const body = await response.json();

  if (response.status === 201) {
    return { outcome: "created", transaction: body.data };
  }

  return {
    outcome: "error",
    error: body.error,
    code: body.code,
    field: body.field,
  };
}

export type FetchTransactionByIdResult =
  | { outcome: "found"; transaction: TransactionRecord }
  | { outcome: "error"; error: string; code: string; field?: string };

export async function fetchTransactionById(
  id: number,
  accessToken: string
): Promise<FetchTransactionByIdResult> {
  const response = await fetch(`/api/transactions/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();

  if (response.status === 200) {
    return { outcome: "found", transaction: body.data };
  }

  return {
    outcome: "error",
    error: body.error,
    code: body.code,
    field: body.field,
  };
}

export type UpdateTransactionResult =
  | { outcome: "updated"; transaction: TransactionRecord }
  | { outcome: "error"; error: string; code: string; field?: string };

export async function updateTransaction(
  id: number,
  input: TransactionInput,
  accessToken: string
): Promise<UpdateTransactionResult> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  const body = await response.json();

  if (response.status === 200) {
    return { outcome: "updated", transaction: body.data };
  }

  return {
    outcome: "error",
    error: body.error,
    code: body.code,
    field: body.field,
  };
}

export type DeleteTransactionResult =
  | { outcome: "deleted" }
  | { outcome: "error"; error: string; code: string; field?: string };

export async function deleteTransaction(
  id: number,
  accessToken: string
): Promise<DeleteTransactionResult> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await response.json();

  if (response.status === 200) {
    return { outcome: "deleted" };
  }

  return {
    outcome: "error",
    error: body.error,
    code: body.code,
    field: body.field,
  };
}

export interface BulkUploadRowError {
  row: number;
  error: string;
  code: string;
  field: string;
}

export type UploadTransactionsFileResult =
  | { outcome: "processed"; inserted: number; failed: number; errors: BulkUploadRowError[] }
  | { outcome: "error"; error: string; code: string; field?: string };

export async function uploadTransactionsFile(
  file: File,
  accessToken: string
): Promise<UploadTransactionsFileResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/transactions/bulk-upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  const body = await response.json();

  if (response.status === 200) {
    return {
      outcome: "processed",
      inserted: body.data.inserted,
      failed: body.data.failed,
      errors: body.errors,
    };
  }

  return {
    outcome: "error",
    error: body.error,
    code: body.code,
    field: body.field,
  };
}
