export interface QuantityTransaction {
  quantity_ordered: number;
  quantity_received?: number | null;
}

export function calculateAverageShortfallUnits(
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

  const shortfalls = recorded
    .filter(
      (transaction) =>
        (transaction.quantity_received as number) < transaction.quantity_ordered
    )
    .map(
      (transaction) =>
        transaction.quantity_ordered - (transaction.quantity_received as number)
    );

  if (shortfalls.length === 0) {
    return 0;
  }

  const total = shortfalls.reduce((sum, units) => sum + units, 0);
  const average = total / shortfalls.length;
  return Math.round(average * 100) / 100;
}
