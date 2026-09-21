import { JaroWinklerDistance } from "natural";

const LEGAL_SUFFIXES = ["sdn bhd", "bhd"];

function normalize(name: string): string {
  let normalized = name.toLowerCase().trim();

  for (const suffix of LEGAL_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length).trim();
      break;
    }
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export function calculateNameSimilarity(nameA: string, nameB: string): number {
  const normalizedA = normalize(nameA);
  const normalizedB = normalize(nameB);

  const score = JaroWinklerDistance(normalizedA, normalizedB, { ignoreCase: true });

  return Math.round(score * 100);
}