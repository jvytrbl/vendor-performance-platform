export function splitNarrativeParagraphs(text: string | null | undefined): string[] {
  if (text == null) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function emphasizeFirstVendorMentions(
  text: string,
  vendorNames: string[]
): Array<{ text: string; emphasize: boolean }> {
  const names = [...new Set(vendorNames.filter((name) => name.trim() !== ""))].sort(
    (left, right) => right.length - left.length
  );
  if (names.length === 0 || text === "") {
    return [{ text, emphasize: false }];
  }

  const used = new Set<string>();
  const segments: Array<{ text: string; emphasize: boolean }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliest: { index: number; length: number; matched: string; key: string } | null = null;
    const lowerRemaining = remaining.toLowerCase();

    for (const name of names) {
      const key = name.toLowerCase();
      if (used.has(key)) continue;
      const index = lowerRemaining.indexOf(key);
      if (index === -1) continue;
      if (!earliest || index < earliest.index) {
        earliest = { index, length: name.length, matched: remaining.slice(index, index + name.length), key };
      }
    }

    if (!earliest) {
      segments.push({ text: remaining, emphasize: false });
      break;
    }

    if (earliest.index > 0) {
      segments.push({ text: remaining.slice(0, earliest.index), emphasize: false });
    }
    segments.push({ text: earliest.matched, emphasize: true });
    used.add(earliest.key);
    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return segments;
}
