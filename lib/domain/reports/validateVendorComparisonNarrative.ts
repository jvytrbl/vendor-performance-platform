export type VendorComparisonNarrativeResult =
  | { valid: true }
  | { valid: false; error: string };

// Whole-vendor leadership/superiority claims only — deliberately excludes
// single-metric trade-off descriptors (cheapest, fastest, fewest shortfalls),
// which the design explicitly allows the AI to use even for a vendor that
// isn't the overall/category leader (e.g. "cheapest but slowest to deliver").
const LEADERSHIP_TERMS = [
  "leads",
  "leading",
  "led",
  "wins",
  "winner",
  "top vendor",
  "outperforms",
  "outperformed",
  "ranks first",
  "ranked first",
  "is the best",
  "is the leader",
  "clear leader",
  "front[- ]?runner",
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Finds where the sentence containing `fromIndex` begins, by scanning for
// the nearest preceding ". "/"! "/"? " boundary (or text start if none).
// Approximate on purpose (doesn't understand abbreviations like "No. 1"),
// acceptable for the short, plainly-punctuated generated text this checks.
function findSentenceStart(text: string, fromIndex: number): number {
  const boundary = /[.!?]\s+/g;
  let lastBoundaryEnd = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(text)) !== null) {
    if (match.index >= fromIndex) break;
    lastBoundaryEnd = match.index + match[0].length;
  }
  return lastBoundaryEnd;
}

/**
 * Checks that the AI-authored comparison text never names a vendor other
 * than the computed leader(s) as leading/winning/best overall. Scoped to
 * ONE subsection's AI-authored text at a time — callers must never pass the
 * code-generated leader sentence itself (it always, correctly, names the
 * real leader, which would make this check meaningless against it).
 *
 * Subject heuristic: for each leadership-term match, the nearest vendor name
 * occurring earlier IN THE SAME SENTENCE is treated as that claim's subject
 * (e.g. "Acme leads while Globex trails" -> Acme is the subject of "leads";
 * Globex is never checked at all, since "trails" isn't a leadership term).
 *
 * Known limits (documented, not solved — a proximity heuristic, not real
 * parsing): passive/reordered phrasing ("Leading the pack was Globex") or
 * negation ("Acme does not lead") are not understood and may be missed or
 * misread. A leadership term with no vendor name earlier in its sentence is
 * not checked at all (nothing to compare against, so nothing is flagged)
 * rather than guessed at.
 *
 * Number-to-vendor attribution ("is this number attached to the RIGHT
 * vendor") is deliberately NOT checked here — validateNarrativeNumbers only
 * confirms a quoted number exists somewhere in the computed data, never
 * that it's attributed to the correct vendor in a given sentence. This is
 * an accepted ceiling: free-text attribution isn't reliably checkable with
 * the pattern-matching approach this codebase's narrative validators use.
 */
export function validateVendorComparisonNarrative(
  text: string,
  leaderVendorIds: number[],
  vendorNames: Map<number, string>
): VendorComparisonNarrativeResult {
  if (text.trim() === "") {
    return { valid: true };
  }

  const namedVendors = Array.from(vendorNames.entries()).filter(
    ([, name]) => name.trim().length > 0
  );
  if (namedVendors.length === 0) {
    return { valid: true };
  }

  const nameToId = new Map<string, number>();
  for (const [id, name] of namedVendors) {
    nameToId.set(name.toLowerCase(), id);
  }
  // Longest name first, so "Acme Trading" is matched whole rather than a
  // shorter vendor name ("Acme") matching inside it and misattributing.
  const vendorNamePattern = new RegExp(
    `\\b(${namedVendors
      .map(([, name]) => name)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|")})\\b`,
    "gi"
  );
  const leadershipPattern = new RegExp(`\\b(${LEADERSHIP_TERMS.join("|")})\\b`, "gi");
  const leaderSet = new Set(leaderVendorIds);

  for (const termMatch of text.matchAll(leadershipPattern)) {
    const termIndex = termMatch.index ?? 0;
    const sentenceStart = findSentenceStart(text, termIndex);
    const prefix = text.slice(sentenceStart, termIndex);

    let subjectId: number | null = null;
    for (const nameMatch of prefix.matchAll(vendorNamePattern)) {
      const id = nameToId.get(nameMatch[0].toLowerCase());
      if (id !== undefined) subjectId = id; // last match = nearest to the term
    }

    if (subjectId === null) continue; // nothing to compare against — not flagged

    if (!leaderSet.has(subjectId)) {
      const subjectName = vendorNames.get(subjectId) ?? `Vendor ${subjectId}`;
      return {
        valid: false,
        error: `"${termMatch[0]}" is attributed to ${subjectName}, who is not the computed leader for this subsection`,
      };
    }
  }

  return { valid: true };
}
