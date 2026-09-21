import type { TransactionRecord } from "../../repositories/transactions";
import type { VendorPeriodMetrics } from "./buildMetricPromptData";
import { calculateOnTimeDeliveryRate } from "./calculateOnTimeDeliveryRate";
import { calculateAverageDelayDays } from "./calculateAverageDelayDays";
import { calculateOverchargeRate } from "./calculateOverchargeRate";
import { calculateAverageOverchargePct } from "./calculateAverageOverchargePct";
import { calculateUnderchargeRate } from "./calculateUnderChargeRate";
import { calculateShortfallRate } from "./calculateShortfallRate";
import { calculateAverageShortfallUnits } from "./calculateAverageShortfallUnits";
import { calculateOverdeliveryRate } from "./calculateOverdeliveryRate";
import { calculateAverageOverdeliveryUnits } from "./calculateAverageOverdeliveryUnits";

function withAgreedDelivery(
  transaction: TransactionRecord
): transaction is TransactionRecord & { agreed_delivery_date: string } {
  return transaction.agreed_delivery_date !== undefined;
}

function withAgreedPrice(
  transaction: TransactionRecord
): transaction is TransactionRecord & { agreed_price: number } {
  return transaction.agreed_price !== undefined;
}

function withQuantityOrdered(
  transaction: TransactionRecord
): transaction is TransactionRecord & { quantity_ordered: number } {
  return transaction.quantity_ordered !== undefined;
}

export function computeVendorPeriodMetrics(
  transactions: TransactionRecord[]
): VendorPeriodMetrics & { transactionCount: number } {
  const deliveryTxs = transactions.filter(withAgreedDelivery);
  const pricedTxs = transactions.filter(withAgreedPrice);
  const quantityTxs = transactions.filter(withQuantityOrdered);

  return {
    onTimeDeliveryRate: calculateOnTimeDeliveryRate(deliveryTxs),
    avgDelayDays: calculateAverageDelayDays(deliveryTxs),
    overchargeRate: calculateOverchargeRate(pricedTxs),
    avgOverchargePct: calculateAverageOverchargePct(pricedTxs),
    underchargeRate: calculateUnderchargeRate(pricedTxs),
    shortfallRate: calculateShortfallRate(quantityTxs),
    avgShortfallUnits: calculateAverageShortfallUnits(quantityTxs),
    overdeliveryRate: calculateOverdeliveryRate(quantityTxs),
    avgOverdeliveryUnits: calculateAverageOverdeliveryUnits(quantityTxs),
    transactionCount: transactions.length,
  };
}
