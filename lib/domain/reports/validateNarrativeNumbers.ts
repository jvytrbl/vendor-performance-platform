export type NarrativeNumberResult =
  | { valid: true }
  | { valid: false; unmatchedValues: number[] };

const ISO_DATE = /\d{4}-\d{2}-\d{2}/g;
const NARRATIVE_NUMBER =
  /(?:RM\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)%?/gi;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseNarrativeNumber(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

export function validateNarrativeNumbers(
  narrativeText: string,
  structuredMetricData: Record<string, number | null | undefined>
): NarrativeNumberResult {
  const allowed = Object.values(structuredMetricData)
    .filter((value): value is number => typeof value === "number")
    .map(round2);

  const strippedDates = narrativeText.replace(ISO_DATE, " ");
  const unmatchedValues: number[] = [];
  const seen = new Set<number>();

  for (const match of strippedDates.matchAll(NARRATIVE_NUMBER)) {
    const extracted = round2(parseNarrativeNumber(match[1]));
    const isAllowed = allowed.some((value) => value === extracted);
    if (!isAllowed && !seen.has(extracted)) {
      seen.add(extracted);
      unmatchedValues.push(extracted);
    }
  }

  if (unmatchedValues.length > 0) {
    return { valid: false, unmatchedValues };
  }

  return { valid: true };
}
