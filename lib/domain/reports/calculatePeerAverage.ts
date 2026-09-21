export interface VendorMetricValue {
  vendorId: number;
  value: number | null;
}

export function calculatePeerAverage(
  vendorId: number,
  metrics: VendorMetricValue[]
): number | null {
  const peerValues = metrics
    .filter((metric) => metric.vendorId !== vendorId)
    .map((metric) => metric.value)
    .filter((value): value is number => value !== null);

  if (peerValues.length === 0) {
    return null;
  }

  const total = peerValues.reduce((sum, value) => sum + value, 0);
  const average = total / peerValues.length;
  return Math.round(average * 100) / 100;
}
