export interface QuantityTransaction {
  quantity_ordered: number;
  quantity_received?: number | null;
}

export function calculateOverdeliveryRate(
  transactions: QuantityTransaction[]
): number | null {
  const recorded = transactions.filter(
    (transaction) =>
      transaction.quantity_received !== null &&
      transaction.quantity_received !== undefined
  );

  if (recorded.length === 0) {
    return null;
  }

  const overdeliveryCount = recorded.filter(
    (transaction) =>
      (transaction.quantity_received as number) > transaction.quantity_ordered
  ).length;

  const rate = (overdeliveryCount / recorded.length) * 100;
  return Math.round(rate * 100) / 100;
}
