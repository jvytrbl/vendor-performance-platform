export type NarrativeComparisonResult =
  | { valid: true }
  | { valid: false; error: string };

const CHARACTERIZATION_TERMS = [
  "improving",
  "improved",
  "improvement",
  "declining",
  "declined",
  "decline",
  "stable",
  "unchanged",
  "better",
  "worse",
  "outperformed",
  "underperformed",
];

const PRIOR_PERIOD_PHRASES = [
  "prior period",
  "previous period",
  "last period",
  "prior-period",
];

const PEER_AVERAGE_PHRASES = [
  "peer average",
  "peer comparison",
  "other vendors",
  "peers",
];

const MISSING_COMPARISON_ERROR =
  "Characterization must compare against both the prior period and the peer average";

function hasPhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export function validateNarrativeComparisons(
  narrativeText: string
): NarrativeComparisonResult {
  const hasCharacterization = CHARACTERIZATION_TERMS.some((term) =>
    hasPhrase(narrativeText, term)
  );

  if (!hasCharacterization) {
    return { valid: true };
  }

  const hasPrior = PRIOR_PERIOD_PHRASES.some((phrase) =>
    hasPhrase(narrativeText, phrase)
  );
  const hasPeer = PEER_AVERAGE_PHRASES.some((phrase) =>
    hasPhrase(narrativeText, phrase)
  );

  if (hasPrior && hasPeer) {
    return { valid: true };
  }

  return { valid: false, error: MISSING_COMPARISON_ERROR };
}
