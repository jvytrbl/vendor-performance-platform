export type NarrativeNumberResult =
  | { valid: true }
  | { valid: false; unmatchedValues: number[] };

const ISO_DATE = /\d{4}-\d{2}-\d{2}/g;
// "Vendor 2", "Vendor 14", etc. — an identifier reference, not a metric value.
// Strip only the id digits immediately after the word "Vendor" so a genuinely
// invented number elsewhere in the same sentence is still caught.
const VENDOR_ID_REFERENCE = /\bVendor\s+\d+\b/gi;
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
  structuredMetricData: Record<string, number | string | null | undefined>
): NarrativeNumberResult {
  const sourceValues = Object.values(structuredMetricData).filter(
    (value): value is number => typeof value === "number"
  );

  // Exact-to-2-decimals matches are always allowed. Additionally, allow the
  // nearest-whole-number rounding of each source value (e.g. 85.71 -> 86) —
  // natural-language narrative text commonly rounds a precise metric to a
  // whole number, and rejecting that as "invented" would reject correct text.
  // This intentionally stays narrow (tied to real source values, not a blanket
  // +/- tolerance) so a genuinely wrong number is still caught.
  const allowed = new Set<number>();
  for (const value of sourceValues) {
    allowed.add(round2(value));
    allowed.add(Math.round(value));
  }

  const strippedText = narrativeText
    .replace(ISO_DATE, " ")
    .replace(VENDOR_ID_REFERENCE, " ");
  const unmatchedValues: number[] = [];
  const seen = new Set<number>();

  for (const match of strippedText.matchAll(NARRATIVE_NUMBER)) {
    const extracted = round2(parseNarrativeNumber(match[1]));
    const isAllowed = allowed.has(extracted);
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
