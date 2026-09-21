import type { TransactionRecord } from "../../api/transactions";
import { PLACEHOLDER, formatDate, formatPrice, formatQuantity } from "./formatters";

export interface FormattedTransactionDetail {
  id: number;
  vendorId: number;
  transactionDate: string;
  itemDescription: string;
  agreedPrice: string;
  actualPrice: string;
  agreedDeliveryDate: string;
  actualDeliveryDate: string;
  quantityOrdered: string;
  quantityReceived: string;
  createdAt: string;
}

export function formatTransactionDetail(
  transaction: TransactionRecord
): FormattedTransactionDetail {
  return {
    id: transaction.id,
    vendorId: transaction.vendor_id,
    transactionDate: formatDate(transaction.transaction_date),
    itemDescription: transaction.item_description ?? PLACEHOLDER,
    agreedPrice: formatPrice(transaction.agreed_price),
    actualPrice: formatPrice(transaction.actual_price),
    agreedDeliveryDate: formatDate(transaction.agreed_delivery_date),
    actualDeliveryDate: formatDate(transaction.actual_delivery_date),
    quantityOrdered: formatQuantity(transaction.quantity_ordered),
    quantityReceived: formatQuantity(transaction.quantity_received),
    createdAt: formatDate(transaction.created_at),
  };
}
