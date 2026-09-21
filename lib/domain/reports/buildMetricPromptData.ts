import { calculatePeerAverage } from "./calculatePeerAverage";

export const METRIC_KEYS = [
  "onTimeDeliveryRate",
  "avgDelayDays",
  "overchargeRate",
  "avgOverchargePct",
  "underchargeRate",
  "shortfallRate",
  "avgShortfallUnits",
  "overdeliveryRate",
  "avgOverdeliveryUnits",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export type VendorPeriodMetrics = {
  [K in MetricKey]: number | null;
};

export interface MetricPromptInput {
  vendorId: number;
  current: VendorPeriodMetrics;
  prior: VendorPeriodMetrics;
  peers: { vendorId: number; metrics: VendorPeriodMetrics }[];
}

export type MetricPromptData = {
  [K in `${MetricKey}Current` | `${MetricKey}Prior` | `${MetricKey}PeerAverage`]:
    | number
    | null;
};

export function buildMetricPromptData(input: MetricPromptInput): MetricPromptData {
  const result = {} as MetricPromptData;

  for (const key of METRIC_KEYS) {
    result[`${key}Current`] = input.current[key];
    result[`${key}Prior`] = input.prior[key];
    result[`${key}PeerAverage`] = calculatePeerAverage(
      input.vendorId,
      input.peers.map((peer) => ({
        vendorId: peer.vendorId,
        value: peer.metrics[key],
      }))
    );
  }

  return result;
}