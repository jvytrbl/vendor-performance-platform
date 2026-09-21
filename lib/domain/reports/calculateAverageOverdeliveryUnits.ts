export interface QuantityTransaction {
  quantity_ordered: number;
  quantity_received?: number | null;
}

export function calculateAverageOverdeliveryUnits(
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

  const overdeliveries = recorded
    .filter(
      (transaction) =>
        (transaction.quantity_received as number) > transaction.quantity_ordered
    )
    .map(
      (transaction) =>
        (transaction.quantity_received as number) - transaction.quantity_ordered
    );

  if (overdeliveries.length === 0) {
    return 0;
  }

  const total = overdeliveries.reduce((sum, units) => sum + units, 0);
  const average = total / overdeliveries.length;
  return Math.round(average * 100) / 100;
}
