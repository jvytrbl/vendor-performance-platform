import type { TransactionRecord } from "../../api/transactions";
import { PLACEHOLDER, formatDate, formatPrice, formatQuantity } from "./formatters";

export interface FormattedTransactionRow {
  id: number;
  vendorId: number;
  transactionDate: string;
  itemDescription: string;
  agreedPrice: string;
  quantityOrdered: string;
  agreedDeliveryDate: string;
  actualDeliveryDate: string;
}

export function formatTransactionForTable(
  transaction: TransactionRecord
): FormattedTransactionRow {
  return {
    id: transaction.id,
    vendorId: transaction.vendor_id,
    transactionDate: formatDate(transaction.transaction_date),
    itemDescription: transaction.item_description ?? PLACEHOLDER,
    agreedPrice: formatPrice(transaction.agreed_price),
    quantityOrdered: formatQuantity(transaction.quantity_ordered),
    agreedDeliveryDate: formatDate(transaction.agreed_delivery_date),
    actualDeliveryDate: formatDate(transaction.actual_delivery_date),
  };
}
